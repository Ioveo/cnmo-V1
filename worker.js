// worker.js

/**
 * NEXUS Backend Worker
 * Handles API requests for R2/KV and serves Static Assets for SPA
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, Range, Authorization',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
  'Access-Control-Max-Age': '86400',
};

// --- AUTH HELPER FUNCTIONS ---

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
    return crypto.randomUUID();
}

async function verifyUserToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    const sessionData = await env.SONIC_KV.get(`session:${token}`);
    
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
        await env.SONIC_KV.delete(`session:${token}`);
        return null;
    }
    
    return session.userId; // Return User ID
}

async function getUser(userId, env) {
    const userData = await env.SONIC_KV.get(`user:${userId}`);
    return userData ? JSON.parse(userData) : null;
}

async function getSystemConfig(env) {
    const raw = await env.SONIC_KV.get('system_config');
    return raw ? JSON.parse(raw) : {};
}

// --- GEMINI PROXY (REST API) ---
const GEMINI_MODEL = 'gemini-2.5-flash';

async function callGeminiRest(env, payload, systemInstruction, schema) {
    // Priority: KV Config > Env Var
    const config = await getSystemConfig(env);
    const apiKey = config.geminiApiKey || env.GEMINI_API_KEY;
    
    if (!apiKey) throw new Error("Server API Key Not Configured");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    // Construct REST body
    const body = {
        contents: payload.contents || [],
        generationConfig: {
            temperature: 0.4,
            // Only add schema if provided (it handles JSON structure)
            ...(schema ? { 
                responseMimeType: "application/json",
                responseSchema: schema 
            } : {})
        },
        // Only add system instruction if provided
        ...(systemInstruction ? {
            systemInstruction: { parts: [{ text: systemInstruction }] }
        } : {})
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    // Extract text from REST response structure
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// --- MAIN WORKER ---

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        const debugHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

        // --- ADMIN AUTH CHECK ---
        const checkAdminAuth = () => {
          const providedPass = (request.headers.get('x-admin-password') || '').trim();
          let envPass = env.ADMIN_PASSWORD || "NEXUS_ADMIN";
          if (providedPass !== envPass) throw new Error('Unauthorized');
        };

        // --- AUTH ROUTES ---

        // 0. VERIFY ADMIN AUTH (Fix for Login)
        if (url.pathname === '/api/verify-auth' && request.method === 'POST') {
            checkAdminAuth();
            return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
        }

        // 1. REGISTER
        if (url.pathname === '/api/auth/register' && request.method === 'POST') {
            const { email, password, username } = await request.json();
            
            // Basic validation
            if (!email || !password || !username) throw new Error("请填写所有字段");
            
            // ONE EMAIL ONE ACCOUNT
            const existing = await env.SONIC_KV.get(`user_email:${email}`);
            if (existing) throw new Error("该邮箱已被注册");
            
            const userId = crypto.randomUUID();
            const passwordHash = await hashPassword(password);
            
            const newUser = {
                id: userId,
                email,
                username,
                passwordHash,
                credits: 5, // INITIAL CREDITS
                createdAt: Date.now()
            };

            // Save user
            await env.SONIC_KV.put(`user:${userId}`, JSON.stringify(newUser));
            await env.SONIC_KV.put(`user_email:${email}`, userId); // Index

            // Create Session
            const token = generateToken();
            const session = { userId, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }; // 7 days
            await env.SONIC_KV.put(`session:${token}`, JSON.stringify(session));

            // Return user without hash
            const { passwordHash: _, ...safeUser } = newUser;
            return new Response(JSON.stringify({ token, user: safeUser }), { headers: debugHeaders });
        }

        // 2. LOGIN
        if (url.pathname === '/api/auth/login' && request.method === 'POST') {
            const { email, password } = await request.json();
            const userId = await env.SONIC_KV.get(`user_email:${email}`);
            
            if (!userId) throw new Error("邮箱或密码错误");
            
            const userRaw = await env.SONIC_KV.get(`user:${userId}`);
            if (!userRaw) throw new Error("用户数据异常");
            
            const user = JSON.parse(userRaw);
            const inputHash = await hashPassword(password);
            
            if (inputHash !== user.passwordHash) throw new Error("邮箱或密码错误");

            // Create Session
            const token = generateToken();
            const session = { userId, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
            await env.SONIC_KV.put(`session:${token}`, JSON.stringify(session));

            const { passwordHash: _, ...safeUser } = user;
            return new Response(JSON.stringify({ token, user: safeUser }), { headers: debugHeaders });
        }

        // 3. GET ME
        if (url.pathname === '/api/auth/me' && request.method === 'GET') {
            const userId = await verifyUserToken(request, env);
            if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: debugHeaders });
            
            const user = await getUser(userId, env);
            if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: debugHeaders });
            
            const { passwordHash: _, ...safeUser } = user;
            return new Response(JSON.stringify({ user: safeUser }), { headers: debugHeaders });
        }
        
        // 4. UPDATE PROFILE
        if (url.pathname === '/api/auth/update' && request.method === 'POST') {
            const userId = await verifyUserToken(request, env);
            if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: debugHeaders });
            
            const { username, password } = await request.json();
            const user = await getUser(userId, env);
            if (!user) throw new Error("User not found");
            
            if (username) user.username = username;
            if (password) {
                user.passwordHash = await hashPassword(password);
            }
            
            await env.SONIC_KV.put(`user:${userId}`, JSON.stringify(user));
            const { passwordHash: _, ...safeUser } = user;
            return new Response(JSON.stringify({ user: safeUser }), { headers: debugHeaders });
        }

        // --- USER MANAGEMENT (ADMIN) ---
        
        if (url.pathname === '/api/users' && request.method === 'GET') {
            checkAdminAuth();
            const list = await env.SONIC_KV.list({ prefix: 'user:' });
            const users = [];
            for (const key of list.keys) {
                const uRaw = await env.SONIC_KV.get(key.name);
                if (uRaw) {
                    const u = JSON.parse(uRaw);
                    const { passwordHash, ...safe } = u;
                    users.push(safe);
                }
            }
            return new Response(JSON.stringify({ users }), { headers: debugHeaders });
        }

        if (url.pathname.match(/\/api\/users\/([^/]+)$/) && request.method === 'DELETE') {
             checkAdminAuth();
             const userId = url.pathname.split('/')[3];
             const user = await getUser(userId, env);
             if (user) {
                 await env.SONIC_KV.delete(`user:${userId}`);
                 await env.SONIC_KV.delete(`user_email:${user.email}`);
             }
             return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
        }
        
        if (url.pathname.match(/\/api\/users\/([^/]+)\/credits$/) && request.method === 'POST') {
             checkAdminAuth();
             const userId = url.pathname.split('/')[3];
             const { amount } = await request.json();
             const user = await getUser(userId, env);
             if (user) {
                 user.credits = (user.credits || 0) + amount;
                 await env.SONIC_KV.put(`user:${userId}`, JSON.stringify(user));
             }
             return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
        }


        // --- AI PROXY ROUTES (WITH CREDIT CHECK) ---

        if (url.pathname.startsWith('/api/ai/')) {
            const userId = await verifyUserToken(request, env);
            if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: debugHeaders });
            
            const user = await getUser(userId, env);
            if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: debugHeaders });
            
            if (user.credits <= 0) {
                return new Response(JSON.stringify({ error: "Insufficient credits" }), { status: 402, headers: debugHeaders });
            }

            const payload = await request.json();
            let resultText = "";

            // --- SYSTEM PROMPT & SCHEMA DEFINITIONS (Inlined for Worker independence) ---
            const ANALYSIS_SCHEMA = {
              type: "OBJECT",
              properties: {
                bpm: { type: "NUMBER" },
                key: { type: "STRING" },
                timeSignature: { type: "STRING" },
                genre: { type: "STRING" },
                mood: { type: "ARRAY", items: { type: "STRING" } },
                instruments: { type: "ARRAY", items: { type: "STRING" } },
                vocalType: { type: "STRING" },
                description: { type: "STRING" },
                rhythmAnalysis: { type: "STRING" },
                compositionAnalysis: { type: "STRING" },
                sections: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      description: { type: "STRING" },
                      instruments: { type: "ARRAY", items: { type: "STRING" } },
                      energyLevel: { type: "STRING" },
                      keyElements: { type: "STRING" },
                      sunoDirective: { type: "STRING" },
                      lyrics: { type: "STRING" }
                    }
                  }
                },
                productionQuality: { type: "STRING" },
                danceability: { type: "NUMBER" },
                energy: { type: "NUMBER" },
                sunoPrompt: { type: "STRING" },
                trackInfo: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        artist: { type: "STRING" },
                        platform: { type: "STRING" }
                    }
                }
              }
            };

            const SYSTEM_INSTRUCTION = `You are a world-class music producer and audio engineer. Analyze the audio or request and provide structured JSON data including BPM, Key, Genre, and a detailed breakdown of song sections (Intro, Verse, Chorus, etc.) with specific Suno.ai style prompts.`;

            // 1. ANALYZE AUDIO
            if (url.pathname === '/api/ai/analyze-audio') {
                const { base64Audio, mimeType } = payload;
                const contents = [{
                    parts: [
                        { inlineData: { mimeType: mimeType || 'audio/mp3', data: base64Audio } },
                        { text: "Analyze this audio track in extreme detail. Return JSON." }
                    ]
                }];
                resultText = await callGeminiRest(env, { contents }, SYSTEM_INSTRUCTION, ANALYSIS_SCHEMA);
            }
            
            // 2. ANALYZE METADATA (LINK)
            else if (url.pathname === '/api/ai/analyze-metadata') {
                 const { query } = payload;
                 const contents = [{
                    parts: [{ text: `Analyze the song "${query}". Provide its likely BPM, Key, Genre, and structure based on public knowledge. Return JSON.` }]
                 }];
                 resultText = await callGeminiRest(env, { contents }, SYSTEM_INSTRUCTION, ANALYSIS_SCHEMA);
            }

            // 3. GENERATE CREATIVE
            else if (url.pathname === '/api/ai/generate-creative') {
                 const { request } = payload;
                 const contents = [{
                    parts: [{ text: `Create a song plan based on this concept: "${request.concept}". Style: ${request.selectedTags.join(', ')}. Template: ${request.structureTemplate}. Return JSON.` }]
                 }];
                 resultText = await callGeminiRest(env, { contents }, SYSTEM_INSTRUCTION, ANALYSIS_SCHEMA);
            }

            // 4. GENERATE REMIX
            else if (url.pathname === '/api/ai/generate-remix') {
                 const { originalData } = payload;
                 const contents = [{
                    parts: [{ text: `Create a Remix/Variation plan for this song. Original BPM: ${originalData.bpm}, Genre: ${originalData.genre}. Make it more electronic/modern. Return JSON.` }]
                 }];
                 resultText = await callGeminiRest(env, { contents }, SYSTEM_INSTRUCTION, ANALYSIS_SCHEMA);
            }
            
            // 5. GENERATE LYRICS (Simple Text)
            else if (url.pathname === '/api/ai/generate-lyrics') {
                const { genre, mood, sectionName, sectionDesc } = payload;
                 const contents = [{
                    parts: [{ text: `Write lyrics for a ${sectionName} section. Genre: ${genre}. Mood: ${mood.join(',')}. Context: ${sectionDesc}. Only return the lyrics text.` }]
                 }];
                 // No Schema for simple text
                 const text = await callGeminiRest(env, { contents }, "You are a professional lyricist.", null);
                 
                 // Deduct credit and return simple object
                 user.credits = user.credits - 1;
                 await env.SONIC_KV.put(`user:${userId}`, JSON.stringify(user));
                 return new Response(JSON.stringify({ text }), { headers: debugHeaders });
            } 
            else {
                throw new Error("Unknown AI Endpoint");
            }

            // DEDUCT CREDIT (For JSON endpoints)
            user.credits = user.credits - 1;
            await env.SONIC_KV.put(`user:${userId}`, JSON.stringify(user));

            // Parse and Return
            try {
                // Sanitize markdown code blocks if Gemini returns them
                const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
                const json = JSON.parse(cleanJson);
                return new Response(JSON.stringify(json), { headers: debugHeaders });
            } catch(e) {
                // If parsing fails, return raw text wrapped in error or handle gracefully
                console.error("JSON Parse Error", resultText);
                throw new Error("AI returned invalid JSON format.");
            }
        }


        // --- SYSTEM CONFIG (KV) ---
        
        if (url.pathname === '/api/system-config') {
             if (request.method === 'GET') {
                 checkAdminAuth();
                 const raw = await env.SONIC_KV.get('system_config');
                 return new Response(raw || JSON.stringify({}), { headers: debugHeaders });
             }
             if (request.method === 'POST') {
                 checkAdminAuth();
                 const body = await request.json();
                 // Merge with existing to avoid overwriting unrelated fields if any
                 const existingRaw = await env.SONIC_KV.get('system_config');
                 const existing = existingRaw ? JSON.parse(existingRaw) : {};
                 const newConfig = { ...existing, ...body };
                 await env.SONIC_KV.put('system_config', JSON.stringify(newConfig));
                 return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
             }
        }


        // ... EXISTING ROUTES ...
        
        if (url.pathname === '/api/site-config') {
            if (request.method === 'GET') {
                const val = await env.SONIC_KV.get('site_config');
                return new Response(val || JSON.stringify({ navLabels: { home: '主控台', video: '影视中心', music: '精选音乐', article: '深度专栏', gallery: '视觉画廊', dashboard: '工坊' } }), { headers: debugHeaders });
            }
            if (request.method === 'POST') {
                checkAdminAuth();
                const body = await request.json();
                await env.SONIC_KV.put('site_config', JSON.stringify(body));
                return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
            }
        }

        if (url.pathname === '/api/stats') {
             if (request.method === 'GET') {
                 const val = await env.SONIC_KV.get('site_stats');
                 return new Response(val || JSON.stringify({ visits: 0, musicPlays: 0, videoPlays: 0, articleViews: 0 }), { headers: debugHeaders });
             }
             if (request.method === 'POST') {
                 const { type, id } = await request.json();
                 const currentRaw = await env.SONIC_KV.get('site_stats');
                 const stats = currentRaw ? JSON.parse(currentRaw) : { visits: 0, musicPlays: 0, videoPlays: 0, articleViews: 0, trackPlays: {}, videoPlayDetails: {}, articleViewDetails: {} };
                 
                 if (type === 'visit') stats.visits = (stats.visits || 0) + 1;
                 if (type === 'music_play') {
                     stats.musicPlays = (stats.musicPlays || 0) + 1;
                     if(id) {
                         stats.trackPlays = stats.trackPlays || {};
                         stats.trackPlays[id] = (stats.trackPlays[id] || 0) + 1;
                     }
                 }
                 if (type === 'video_play') {
                     stats.videoPlays = (stats.videoPlays || 0) + 1;
                     if(id) {
                         stats.videoPlayDetails = stats.videoPlayDetails || {};
                         stats.videoPlayDetails[id] = (stats.videoPlayDetails[id] || 0) + 1;
                     }
                 }
                 if (type === 'article_view') {
                     stats.articleViews = (stats.articleViews || 0) + 1;
                     if(id) {
                         stats.articleViewDetails = stats.articleViewDetails || {};
                         stats.articleViewDetails[id] = (stats.articleViewDetails[id] || 0) + 1;
                     }
                 }
                 
                 await env.SONIC_KV.put('site_stats', JSON.stringify(stats));
                 return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
             }
        }

        // KV CRUD Helper
        const handleKvCrud = async (key) => {
            if (request.method === 'GET') {
                const val = await env.SONIC_KV.get(key);
                return new Response(val || '[]', { headers: debugHeaders });
            }
            if (request.method === 'POST') {
                checkAdminAuth();
                const body = await request.json();
                await env.SONIC_KV.put(key, JSON.stringify(body));
                return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
            }
        };

        if (url.pathname === '/api/tracks') return await handleKvCrud('tracks');
        if (url.pathname === '/api/videos') return await handleKvCrud('videos');
        if (url.pathname === '/api/articles') return await handleKvCrud('articles');
        if (url.pathname === '/api/gallery') return await handleKvCrud('gallery');
        if (url.pathname === '/api/categories') return await handleKvCrud('categories');
        if (url.pathname === '/api/playlists') return await handleKvCrud('playlists');

        // J. HEALTH CHECK
        if (url.pathname === '/api/health-check') {
             if (!env.SONIC_BUCKET) return new Response(JSON.stringify({ status: 'error' }), { headers: debugHeaders });
             await env.SONIC_BUCKET.list({ limit: 1 });
             return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
        }
        
        // H. UPLOAD (SINGLE)
        if (url.pathname === '/api/upload' && request.method === 'PUT') {
            checkAdminAuth();
            const key = url.searchParams.get('key');
            if (!key) throw new Error("Missing key");
            if (!env.SONIC_BUCKET) throw new Error("Bucket not bound");
            
            await env.SONIC_BUCKET.put(key, request.body, {
                httpMetadata: { contentType: request.headers.get('Content-Type') || undefined }
            });
            return new Response(JSON.stringify({ url: `/api/file/${key}` }), { headers: debugHeaders });
        }

        // I. MULTIPART UPLOAD
        if (url.pathname.startsWith('/api/upload/mp/')) {
            checkAdminAuth();
            if (!env.SONIC_BUCKET) throw new Error("Bucket not bound");
            const key = url.searchParams.get('key');
            const uploadId = url.searchParams.get('uploadId');

            if (url.pathname.endsWith('/create')) {
                const { filename, contentType } = await request.json();
                const ext = filename.split('.').pop();
                const newKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
                const multipartUpload = await env.SONIC_BUCKET.createMultipartUpload(newKey, {
                    httpMetadata: { contentType }
                });
                return new Response(JSON.stringify({ uploadId: multipartUpload.uploadId, key: multipartUpload.key }), { headers: debugHeaders });
            }

            if (url.pathname.endsWith('/part')) {
                const partNumber = parseInt(url.searchParams.get('partNumber'));
                const part = await env.SONIC_BUCKET.resumeMultipartUpload(key, uploadId);
                const uploadedPart = await part.uploadPart(partNumber, request.body);
                return new Response(JSON.stringify({ etag: uploadedPart.etag }), { headers: debugHeaders });
            }

            if (url.pathname.endsWith('/complete')) {
                const { parts } = await request.json();
                const part = await env.SONIC_BUCKET.resumeMultipartUpload(key, uploadId);
                await part.complete(parts);
                return new Response(JSON.stringify({ url: `/api/file/${key}` }), { headers: debugHeaders });
            }
        }
        
        // STORAGE LIST
        if (url.pathname === '/api/storage/list') {
            checkAdminAuth();
            if (!env.SONIC_BUCKET) return new Response(JSON.stringify({ files: [] }), { headers: debugHeaders });
            const list = await env.SONIC_BUCKET.list();
            return new Response(JSON.stringify({ files: list.objects }), { headers: debugHeaders });
        }

        // DELETE FILE
        if (url.pathname.startsWith('/api/delete-file/')) {
            checkAdminAuth();
            const key = url.pathname.split('/api/delete-file/')[1];
            if (!env.SONIC_BUCKET) throw new Error("Bucket not bound");
            await env.SONIC_BUCKET.delete(key);
            return new Response(JSON.stringify({ status: 'ok' }), { headers: debugHeaders });
        }

         return new Response(JSON.stringify({ error: "Route Not Found" }), { status: 404, headers: corsHeaders });

      } catch (e) {
        const status = e.message.includes('Unauthorized') ? 401 : 500;
        return new Response(JSON.stringify({ error: e.message }), { status, headers: corsHeaders });
      }
    }

    try {
        let response = await env.ASSETS.fetch(request);
        if (response.status === 404) {
            return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
        }
        return response;
    } catch (e) {
        return new Response("Internal Server Error", { status: 500 });
    }
  },
};
