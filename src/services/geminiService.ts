
// src/services/geminiService.ts

import { AudioAnalysisResult, CreativeGeneratorRequest } from "../types";
import { authService } from "./authService";

// We now call our backend proxy which handles the Gemini API call and credit deduction
// This is secure and enforces the 5-credit limit.

async function callAIProxy(endpoint: string, payload: any): Promise<any> {
    const token = localStorage.getItem('nexus_auth_token');
    
    // Check if logged in
    if (!token) {
        throw new Error("请先登录以使用 AI 功能 (Please login to use AI features)");
    }

    const res = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        headers: authService.getHeaders(), // Includes Bearer token
        body: JSON.stringify(payload)
    });

    if (res.status === 401) {
        throw new Error("登录已过期，请重新登录");
    }
    
    if (res.status === 402 || res.status === 403) {
        throw new Error("点数不足！每个用户仅限 5 次 AI 生成。 (Insufficient credits. Limit 5 per user.)");
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI Service Error");
    }

    return await res.json();
}

export const analyzeAudioWithGemini = async (base64Audio: string, mimeType: string): Promise<AudioAnalysisResult> => {
    return await callAIProxy('analyze-audio', { base64Audio, mimeType });
};

export const analyzeMusicMetadata = async (query: string): Promise<AudioAnalysisResult> => {
    return await callAIProxy('analyze-metadata', { query });
};

export const generateCreativeSunoPlan = async (request: CreativeGeneratorRequest): Promise<AudioAnalysisResult> => {
    return await callAIProxy('generate-creative', { request });
};

export const generateInstantRemix = async (originalData: AudioAnalysisResult): Promise<AudioAnalysisResult> => {
    return await callAIProxy('generate-remix', { originalData });
};

// This one is cheap/internal, maybe allow client side or proxy? 
// For consistency, proxy it, but maybe don't deduct credits? 
// For now, let's assume section lyrics are part of the 'generate' flows usually.
// If standalone, we proxy it.
export const generateSectionLyrics = async (genre: string, mood: string[], sectionName: string, sectionDesc: string): Promise<string> => {
    const res = await callAIProxy('generate-lyrics', { genre, mood, sectionName, sectionDesc });
    return res.text;
};
