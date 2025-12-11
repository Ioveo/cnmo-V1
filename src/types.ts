
// src/types.ts

export interface User {
  id: string;
  email: string;
  username: string;
  credits: number; // Remaining API calls
  createdAt: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SongSection {
  name: string;
  description: string;
  instruments: string[];
  energyLevel: string;
  keyElements: string;
  sunoDirective: string;
  lyrics?: string;
}

export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  timeSignature: string;
  genre: string;
  mood: string[];
  instruments: string[];
  vocalType: string;
  description: string;
  rhythmAnalysis: string;
  compositionAnalysis: string;
  sections: SongSection[];
  productionQuality: string;
  danceability: number;
  energy: number;
  sunoPrompt: string;
  trackInfo?: {
    title: string;
    artist: string;
    platform: string;
  };
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PROCESSING_AUDIO = 'PROCESSING_AUDIO',
  ANALYZING_AI = 'ANALYZING_AI',
  CREATING_PLAN = 'CREATING_PLAN',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface CreativeGeneratorRequest {
  concept: string;
  selectedTags: string[];
  structureTemplate: 'pop' | 'edm' | 'cinematic' | 'random';
}

export interface GalleryTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  sourceType: 'local' | 'netease' | 'qq' | 'link';
  src: string;
  addedAt: number;
  lyrics?: string;
  categoryId?: string;
  isHero?: boolean;
  album?: string;
  duration?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  trackIds: string[];
  addedAt: number;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  content: string;
  coverUrl: string;
  trackId?: string;
  publishedAt: number;
  categoryId?: string;
  isHero?: boolean; 
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  uploadedAt: number;
  categoryId?: string;
}

export interface Video {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  videoUrl: string;
  audioUrl?: string; // New: Optional separate audio track
  sourceType: 'local' | 'external';
  category: string;
  categoryId?: string;
  addedAt: number;
  description?: string;
  isHero?: boolean; // Global Home Page Hero
  isVideoPageHero?: boolean; // Video Hub Page Hero
  adSlogan?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'music' | 'video' | 'article' | 'gallery';
  slug?: string;
}

export interface SiteConfig {
    navLabels: {
        home: string;
        video: string;
        music: string;
        article: string;
        gallery: string;
        dashboard: string;
    }
}

export interface SiteStats {
    visits: number;
    musicPlays: number;
    videoPlays: number;
    articleViews: number;
    
    // Detailed Stats (ID -> Count)
    trackPlays?: Record<string, number>;
    videoPlayDetails?: Record<string, number>;
    articleViewDetails?: Record<string, number>;
}