
// src/services/storageService.ts

import { GalleryTrack, Article, GalleryImage, Video, Category, Playlist, SiteConfig, SiteStats } from '../types';

const API_BASE = ''; 

const getHeaders = () => {
    const pwd = localStorage.getItem('admin_password') || '';
    return {
        'Content-Type': 'application/json',
        'x-admin-password': pwd
    };
};

export const storageService = {
  async verifyAuth(password: string): Promise<boolean> {
      try {
          const res = await fetch(`${API_BASE}/api/verify-auth`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'x-admin-password': password 
              }
          });
          if (!res.ok) return false;
          return true;
      } catch (e) {
          return false;
      }
  },

  async checkR2Status(): Promise<{ ok: boolean; message: string }> {
      try {
          const res = await fetch(`${API_BASE}/api/health-check`);
          if (!res.ok) return { ok: false, message: "API Error" };
          const data = await res.json();
          return { ok: data.status === 'ok', message: data.message };
      } catch (e: any) {
          return { ok: false, message: e.message || "Network Error" };
      }
  },

  async listFiles(): Promise<any[]> {
      try {
          const res = await fetch(`${API_BASE}/api/storage/list`, {
              headers: { 'x-admin-password': localStorage.getItem('admin_password') || '' }
          });
          if (!res.ok) return [];
          const data = await res.json();
          return data.files || [];
      } catch (e) {
          console.warn("List Files Error", e);
          return [];
      }
  },

  // --- KV METHODS ---
  
  async getTracks(): Promise<GalleryTrack[]> {
    const res = await fetch(`${API_BASE}/api/tracks`);
    return res.ok ? await res.json() : [];
  },
  async saveTracks(data: GalleryTrack[]) {
    await fetch(`${API_BASE}/api/tracks`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  },

  async getPlaylists(): Promise<Playlist[]> {
    const res = await fetch(`${API_BASE}/api/playlists`);
    return res.ok ? await res.json() : [];
  },
  async savePlaylists(data: Playlist[]) {
    await fetch(`${API_BASE}/api/playlists`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  },

  async getArticles(): Promise<Article[]> {
    const res = await fetch(`${API_BASE}/api/articles`);
    return res.ok ? await res.json() : [];
  },
  async saveArticles(data: Article[]) {
    await fetch(`${API_BASE}/api/articles`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  },

  async getGallery(): Promise<GalleryImage[]> {
    const res = await fetch(`${API_BASE}/api/gallery`);
    return res.ok ? await res.json() : [];
  },
  async saveGallery(data: GalleryImage[]) {
    await fetch(`${API_BASE}/api/gallery`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  },

  async getVideos(): Promise<Video[]> {
    const res = await fetch(`${API_BASE}/api/videos`);
    return res.ok ? await res.json() : [];
  },
  async saveVideos(data: Video[]) {
    await fetch(`${API_BASE}/api/videos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("API Error", e);
      return [];
    }
  },

  async saveCategories(data: Category[]): Promise<void> {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save categories');
  },

  // --- SITE CONFIG & STATS ---

  async getSiteConfig(): Promise<SiteConfig> {
      try {
          const res = await fetch(`${API_BASE}/api/site-config`);
          return res.ok ? await res.json() : { navLabels: { home: '主控台', video: '影视中心', music: '精选音乐', article: '深度专栏', gallery: '视觉画廊', dashboard: '工坊' } };
      } catch (e) {
          return { navLabels: { home: '主控台', video: '影视中心', music: '精选音乐', article: '深度专栏', gallery: '视觉画廊', dashboard: '工坊' } };
      }
  },

  async saveSiteConfig(config: SiteConfig) {
      await fetch(`${API_BASE}/api/site-config`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(config) });
  },

  async getStats(): Promise<SiteStats> {
      try {
          const res = await fetch(`${API_BASE}/api/stats`, { headers: getHeaders() });
          return res.ok ? await res.json() : { visits: 0, musicPlays: 0, videoPlays: 0, articleViews: 0 };
      } catch (e) {
          return { visits: 0, musicPlays: 0, videoPlays: 0, articleViews: 0 };
      }
  },

  async incrementStat(type: 'visit' | 'music_play' | 'video_play' | 'article_view', id?: string) {
      try {
          await fetch(`${API_BASE}/api/stats`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, id }) 
          });
      } catch (e) {
          console.warn("Stat increment failed", e);
      }
  },

  // --- SMART UPLOAD: SUPPORTS LARGE FILES VIA MULTIPART ---
  async uploadFile(file: File, onProgress?: (percent: number) => void): Promise<string> {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB Chunks (Safe for Worker)
    
    // 1. Small files (< 20MB): Use simple upload
    if (file.size < 20 * 1024 * 1024) {
        return new Promise((resolve, reject) => {
            const ext = file.name.split('.').pop();
            const uniqueKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', `${API_BASE}/api/upload?key=${uniqueKey}`, true);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.setRequestHeader('x-admin-password', localStorage.getItem('admin_password') || '');
            
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
            };
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try { resolve(JSON.parse(xhr.responseText).url); } catch(e) { resolve(xhr.responseText); }
                } else reject(new Error("Upload Failed"));
            };
            xhr.onerror = () => reject(new Error("Network Error"));
            xhr.send(file);
        });
    }

    // 2. Large files: Multipart Upload
    try {
        const pwd = localStorage.getItem('admin_password') || '';
        
        // A. Init
        const initRes = await fetch(`${API_BASE}/api/upload/mp/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-password': pwd },
            body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        if (!initRes.ok) throw new Error("Init Upload Failed");
        const { uploadId, key } = await initRes.json();

        // B. Upload Parts
        const totalParts = Math.ceil(file.size / CHUNK_SIZE);
        const parts: { partNumber: number, etag: string }[] = [];

        for (let i = 0; i < totalParts; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const partNumber = i + 1;

            const partRes = await fetch(`${API_BASE}/api/upload/mp/part?uploadId=${uploadId}&key=${key}&partNumber=${partNumber}`, {
                method: 'PUT',
                headers: { 'x-admin-password': pwd },
                body: chunk
            });

            if (!partRes.ok) throw new Error(`Part ${partNumber} Failed`);
            const { etag } = await partRes.json();
            parts.push({ partNumber, etag });

            if (onProgress) onProgress(((i + 1) / totalParts) * 100);
        }

        // C. Complete
        const completeRes = await fetch(`${API_BASE}/api/upload/mp/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-password': pwd },
            body: JSON.stringify({ uploadId, key, parts })
        });
        
        if (!completeRes.ok) throw new Error("Completion Failed");
        const { url } = await completeRes.json();
        return url;

    } catch (e: any) {
        throw new Error(e.message || "Multipart Upload Error");
    }
  },

  async deleteFile(url: string): Promise<void> {
      const parts = url.split('/api/file/');
      if (parts.length > 1) {
          await fetch(`${API_BASE}/api/delete-file/${parts[1]}`, { method: 'DELETE', headers: getHeaders() });
      }
  }
};
