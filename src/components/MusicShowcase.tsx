
// src/components/MusicShowcase.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GalleryTrack, Article, GalleryImage, Video, Category, Playlist, SiteConfig, SiteStats, User } from '../types';
import { SonicMascot } from './SonicMascot';
import { ArticleView } from './ArticleView';
import { storageService } from '../services/storageService';

// Module Imports
import { MusicGrid } from './MusicGrid';
import { MusicManager } from './MusicManager';
import { VideoGrid } from './VideoGrid';
import { VideoManager } from './VideoManager';
import { EditorialHub } from './ArticleGrid'; 
import { ArticleManager } from './ArticleManager';
import { GalleryGrid } from './GalleryGrid';
import { GalleryManager } from './GalleryManager';
import { CategoryManager } from './CategoryManager';
import { PlaylistManager } from './PlaylistManager'; 
import { SiteSettingsManager } from './SiteSettingsManager';

// Shared UI
import { Navbar, AdminLoginModal, SectionHeader, GlobalPlayer } from './Common';
// NEW USER UI
import { UserMenu } from './AuthUI';

interface MusicShowcaseProps {
  currentView: 'home' | 'music' | 'video' | 'article' | 'gallery';
  tracks: GalleryTrack[];
  videos: Video[];
  articles: Article[];
  gallery: GalleryImage[];
  categories: Category[];
  playlists?: Playlist[]; 
  
  siteConfig: SiteConfig | null;
  siteStats: SiteStats | null;
  currentUser: User | null; // Pass user data

  onRecordStat: (type: 'visit' | 'music_play' | 'video_play' | 'article_view', id?: string) => void;
  onUpdateSiteConfig: (c: SiteConfig) => void;

  onUpdateTracks: (d: any) => void;
  onUpdateVideos: (d: any) => void;
  onUpdateArticles: (d: any) => void;
  onUpdateGallery: (d: any) => void;
  onUpdateCategories: (d: any) => void;
  onUpdatePlaylists?: (d: any) => void; 
  
  onNavigate: (view: any) => void;
  onOpenSettings: () => void;
  onAnalyze: (file: File) => void;
  onLoginReq: () => void;
  onLogout: () => void;
}

// ... AdminPanel code ...
interface AdminPanelProps {
    activeTab: string;
    setActiveTab: (t: string) => void;
    onExit: () => void;
    tracks: GalleryTrack[];
    videos: Video[];
    articles: Article[];
    gallery: GalleryImage[];
    categories: Category[];
    playlists: Playlist[];
    siteConfig: SiteConfig | null;
    siteStats: SiteStats | null;
    onUpdateSiteConfig: (c: SiteConfig) => void;
    onUpdateTracks: (d: any) => void;
    onUpdateVideos: (d: any) => void;
    onUpdateArticles: (d: any) => void;
    onUpdateGallery: (d: any) => void;
    onUpdateCategories: (d: any) => void;
    onUpdatePlaylists: (d: any) => void;
    onStopGlobalMusic: () => void;
}

const AdminSidebarItem = ({ id, label, icon, activeTab, onClick }: any) => (
    <button 
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-r-2 ${activeTab === id ? 'border-lime-500 bg-white/5 text-white' : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
        <div className={`w-5 h-5 ${activeTab === id ? 'text-lime-400' : 'text-slate-500'}`}>{icon}</div>
        <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </button>
);

const TopList = ({ 
    title, 
    data, 
    items, 
    type 
}: { 
    title: string, 
    data: Record<string, number>, 
    items: any[], 
    type: 'track' | 'video' | 'article' 
}) => {
    // Sort and slice top 20
    const sorted = Object.entries(data || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20);
    
    if (sorted.length === 0) return null;

    const maxCount = sorted[0][1];

    return (
        <div className="bg-[#111]/80 backdrop-blur border border-white/10 p-6 rounded-2xl h-full flex flex-col">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'track' ? 'bg-lime-400' : type === 'video' ? 'bg-orange-400' : 'bg-cyan-400'}`}></div>
                {title}
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {sorted.map(([id, count], idx) => {
                    const item = items.find(i => i.id === id);
                    if (!item) return null;
                    return (
                        <div key={id} className="flex items-center gap-4 group">
                            <span className={`text-xs font-mono font-bold w-6 text-center ${idx < 3 ? 'text-white' : 'text-slate-600'}`}>
                                {(idx + 1).toString().padStart(2,'0')}
                            </span>
                            <div className="w-10 h-10 rounded overflow-hidden bg-black border border-white/10 shrink-0">
                                <img src={item.coverUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-white truncate">{item.title}</div>
                                <div className="text-[10px] text-slate-500 truncate">{type === 'track' ? item.artist : type === 'video' ? item.author : item.author}</div>
                                {/* Progress Bar */}
                                <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${type === 'track' ? 'bg-lime-500' : type === 'video' ? 'bg-orange-500' : 'bg-cyan-500'}`} 
                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-white font-bold">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AdminPanel = React.memo((props: AdminPanelProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
         <div className="fixed inset-0 z-[150] bg-[#050505] text-white flex flex-col md:flex-row animate-fade-in">
            {/* Mobile Header for Admin */}
            <div className="md:hidden h-16 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a]">
                <h1 className="text-lg font-display font-black text-white">NEXUS <span className="text-lime-500">CORE</span></h1>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            {/* Sidebar (Responsive Drawer) */}
            <div className={`
                fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col z-50 transform transition-transform duration-300 md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-8 border-b border-white/10 hidden md:block">
                    <h1 className="text-2xl font-display font-black text-white tracking-tighter">NEXUS <span className="text-lime-500">CORE</span></h1>
                    <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase tracking-widest">System Administration</p>
                </div>
                <div className="flex-1 py-6 overflow-y-auto">
                    <AdminSidebarItem id="dashboard" label="概览仪表盘" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
                    <AdminSidebarItem id="site_config" label="站点配置" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                    <AdminSidebarItem id="music" label="音乐资源管理" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>} />
                    <AdminSidebarItem id="playlist" label="精选歌单管理" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
                    <AdminSidebarItem id="video" label="影视库管理" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} />
                    <AdminSidebarItem id="article" label="专栏文章管理" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>} />
                    <AdminSidebarItem id="gallery" label="视觉画廊管理" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                    <AdminSidebarItem id="category" label="全局分类配置" activeTab={props.activeTab} onClick={(id: string) => { props.setActiveTab(id); setIsSidebarOpen(false); }} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} />
                </div>
                <div className="p-6 border-t border-white/10">
                    <button onClick={props.onExit} className="w-full py-3 border border-white/20 hover:border-red-500 hover:text-red-500 text-slate-400 font-bold uppercase tracking-widest text-xs transition-colors rounded">
                        退出安全模式
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-[#050505] overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="relative z-10 p-4 md:p-12 w-full">
                    <div className="mb-8 flex items-end justify-between">
                         <div>
                             <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 uppercase">{props.activeTab.replace('_', ' ')}</h2>
                             <p className="text-slate-500 text-xs md:text-sm font-mono">Administration Module Active</p>
                         </div>
                    </div>
                    <div>
                        {props.activeTab === 'dashboard' && (
                            <div className="space-y-8">
                                {/* TRAFFIC STATS */}
                                <div className="bg-[#111]/80 backdrop-blur border border-white/10 p-6 rounded-2xl">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-acid rounded-full animate-pulse"></div>
                                        流量数据监控 (Overview)
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { label: "全站访问", val: props.siteStats?.visits || 0, color: "text-white" },
                                            { label: "歌曲播放", val: props.siteStats?.musicPlays || 0, color: "text-lime-400" },
                                            { label: "视频播放", val: props.siteStats?.videoPlays || 0, color: "text-orange-400" },
                                            { label: "文章阅读", val: props.siteStats?.articleViews || 0, color: "text-cyan-400" },
                                        ].map((s,i) => (
                                            <div key={i} className="flex flex-col">
                                                <span className={`text-3xl font-display font-black ${s.color}`}>{s.val}</span>
                                                <span className="text-[10px] text-slate-500 uppercase font-mono mt-1">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* DETAILED ANALYTICS (TOP 20) */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
                                    <TopList 
                                        title="热歌 TOP 20" 
                                        data={props.siteStats?.trackPlays || {}} 
                                        items={props.tracks} 
                                        type="track" 
                                    />
                                    <TopList 
                                        title="热门影视 TOP 20" 
                                        data={props.siteStats?.videoPlayDetails || {}} 
                                        items={props.videos} 
                                        type="video" 
                                    />
                                    <TopList 
                                        title="热门文章 TOP 20" 
                                        data={props.siteStats?.articleViewDetails || {}} 
                                        items={props.articles} 
                                        type="article" 
                                    />
                                </div>

                                {/* CONTENT STATS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: "总曲目", val: props.tracks.length, color: "text-lime-400", bg: "bg-lime-500/10" },
                                        { label: "精选歌单", val: props.playlists?.length || 0, color: "text-purple-400", bg: "bg-purple-500/10" },
                                        { label: "影视资源", val: props.videos.length, color: "text-orange-400", bg: "bg-orange-500/10" },
                                        { label: "专栏文章", val: props.articles.length, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[#111]/80 backdrop-blur border border-white/10 p-6 rounded-xl hover:border-white/30 transition-all group">
                                            <div className={`w-12 h-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4 text-xl font-bold`}>
                                                {i === 0 ? '♫' : i === 1 ? '▣' : i === 2 ? '▶' : 'Aa'}
                                            </div>
                                            <div className="text-3xl font-display font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">{stat.val}</div>
                                            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {props.activeTab === 'site_config' && (
                            <SiteSettingsManager 
                                config={props.siteConfig} 
                                onUpdate={props.onUpdateSiteConfig} 
                            />
                        )}
                        {props.activeTab === 'music' && (
                            <MusicManager 
                                tracks={props.tracks} 
                                categories={props.categories}
                                onUpdate={props.onUpdateTracks}
                                onStopGlobalMusic={props.onStopGlobalMusic}
                            />
                        )}
                        {props.activeTab === 'playlist' && (
                            <PlaylistManager 
                                playlists={props.playlists || []}
                                tracks={props.tracks}
                                onUpdate={props.onUpdatePlaylists || (() => {})}
                            />
                        )}
                        {props.activeTab === 'video' && <VideoManager videos={props.videos} categories={props.categories} onUpdate={props.onUpdateVideos} />}
                        {props.activeTab === 'article' && <ArticleManager articles={props.articles} tracks={props.tracks} categories={props.categories} onUpdate={props.onUpdateArticles} />}
                        {props.activeTab === 'gallery' && <GalleryManager images={props.gallery} onUpdate={props.onUpdateGallery} />}
                        {props.activeTab === 'category' && <CategoryManager categories={props.categories} onUpdate={props.onUpdateCategories} />}
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- MAIN COMPONENT ---

export const MusicShowcase: React.FC<MusicShowcaseProps> = (props) => {
    const [adminMode, setAdminMode] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard'); 
    
    // Playback State
    const [playingId, setPlayingId] = useState<string|null>(null);
    const [playQueue, setPlayQueue] = useState<string[]>([]);
    const [playbackMode, setPlaybackMode] = useState<'loop' | 'single' | 'shuffle'>('loop'); // Added mode state
    
    const [readingArticle, setReadingArticle] = useState<Article | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const handleAdminClick = useCallback(() => {
        const storedPwd = localStorage.getItem('admin_password');
        if (storedPwd) {
            storageService.verifyAuth(storedPwd).then(valid => {
                if (valid) setAdminMode(true); else setShowLoginModal(true);
            });
        } else { setShowLoginModal(true); }
    }, []);

    const handleLoginSubmit = async (pwd: string) => {
        const valid = await storageService.verifyAuth(pwd);
        if (valid) { localStorage.setItem('admin_password', pwd); setAdminMode(true); return true; }
        return false;
    };
    
    const currentTrack = props.tracks.find(t => t.id === playingId);
    
    // --- PLAYBACK CONTROLS ---

    const handlePlay = useCallback((id: string | null, queue?: string[]) => {
        if (id && queue && queue.length > 0) {
            setPlayQueue(queue);
        }
        
        if (id) {
            props.onRecordStat('music_play', id); // Record Play Stat with ID
        }

        setPlayingId(prev => prev === id ? null : id);
    }, [props.onRecordStat]);

    const handleStopGlobalMusic = useCallback(() => {
        setPlayingId(null);
        if (audioRef.current) audioRef.current.pause();
    }, []);

    const handleToggleMode = useCallback(() => {
        setPlaybackMode(prev => {
            if (prev === 'loop') return 'single';
            if (prev === 'single') return 'shuffle';
            return 'loop';
        });
    }, []);

    const handleNext = useCallback(() => {
        if (!playingId) return;
        
        let nextId = null;
        
        if (playQueue.length > 0) {
            if (playbackMode === 'shuffle') {
                // Pick random from queue
                const randIndex = Math.floor(Math.random() * playQueue.length);
                nextId = playQueue[randIndex];
            } else {
                // Loop or Single (manual next overrides single loop usually)
                const currentIndex = playQueue.indexOf(playingId);
                if (currentIndex !== -1) {
                    const nextIndex = (currentIndex + 1) % playQueue.length;
                    nextId = playQueue[nextIndex];
                }
            }
        }
        
        // Fallback: Random if not in queue or queue empty
        if (!nextId) {
            const randomIndex = Math.floor(Math.random() * props.tracks.length);
            nextId = props.tracks[randomIndex]?.id;
        }

        if (nextId) {
            setPlayingId(nextId);
            props.onRecordStat('music_play', nextId);
        }
    }, [playingId, playQueue, props.tracks, playbackMode, props.onRecordStat]);

    const handleSongEnd = useCallback(() => {
        if (playbackMode === 'single') {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
                if (playingId) props.onRecordStat('music_play', playingId);
            }
        } else {
            handleNext();
        }
    }, [playbackMode, handleNext, props.onRecordStat, playingId]);

    const handlePrev = useCallback(() => {
        if (!playingId) return;
        
        let prevId = null;
        if (playQueue.length > 0) {
            if (playbackMode === 'shuffle') {
                 // In shuffle, prev usually behaves like "History Back" but for simplicity we can just pick random or prev in list
                 // Let's do random for consistency with "Shuffle"
                 const randIndex = Math.floor(Math.random() * playQueue.length);
                 prevId = playQueue[randIndex];
            } else {
                const currentIndex = playQueue.indexOf(playingId);
                if (currentIndex !== -1) {
                    // If current time > 3s, just restart song
                    if (audioRef.current && audioRef.current.currentTime > 3) {
                        audioRef.current.currentTime = 0;
                        return;
                    }
                    const prevIndex = (currentIndex - 1 + playQueue.length) % playQueue.length;
                    prevId = playQueue[prevIndex];
                }
            }
        }

        if (prevId) {
            setPlayingId(prevId);
            props.onRecordStat('music_play', prevId);
        }
    }, [playingId, playQueue, playbackMode, props.onRecordStat]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    }, []);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current && audioRef.current.duration) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = percent * audioRef.current.duration;
        }
    }, []);
    
    const getAudioSrc = (track: GalleryTrack | undefined) => {
        if (!track) return "";
        if (track.sourceType === 'local') return track.src;
        if (track.sourceType === 'netease') return `https://music.163.com/song/media/outer/url?id=${track.src}.mp3`;
        return track.src;
    };

    const isCorsRestricted = currentTrack?.sourceType === 'netease' || currentTrack?.sourceType === 'qq';

    const renderHomeView = () => {
        const heroVideo = props.videos.find(v => v.isHero) || props.videos.find(v => v.isVideoPageHero) || props.videos[0];
        
        return (
            <div className="relative z-10 w-full min-h-screen text-white overflow-hidden pb-32">
                <div className="fixed inset-0 bg-aurora opacity-30 pointer-events-none z-[-1]"></div>
                <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505] z-[-1]"></div>
                
                {/* Hero Section */}
                <div className="relative w-full h-[80vh] md:h-screen mb-0 group overflow-hidden bg-black">
                    <div className="absolute inset-0 z-0">
                        {heroVideo ? (
                            heroVideo.videoUrl ? 
                            <video src={heroVideo.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline /> 
                            : <img src={heroVideo.coverUrl} className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">NO HERO CONTENT</div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full px-4 md:px-12 pb-24 md:pb-32 z-10 flex flex-col items-start gap-6 max-w-[95%] md:max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold uppercase tracking-widest">全站首映</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl lg:text-9xl font-display font-black leading-none tracking-tighter drop-shadow-2xl mix-blend-overlay opacity-90 line-clamp-2">
                            {heroVideo?.title || "NEXUS AUDIO"}
                        </h1>
                        
                        {/* CHANGED: Only render if description exists */}
                        {heroVideo?.description && (
                            <p className="text-sm md:text-xl text-slate-200 font-light max-w-xl leading-relaxed border-l-4 border-acid pl-4 md:pl-6 bg-black/20 backdrop-blur-sm p-3 md:p-4 rounded-r-xl line-clamp-3 md:line-clamp-none">
                                {heroVideo.description}
                            </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 md:mt-4">
                            <button onClick={() => { handleStopGlobalMusic(); props.onNavigate('video'); }} className="px-6 md:px-8 py-3 md:py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-acid hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] text-xs md:text-sm">
                                立即观看
                            </button>
                            <button onClick={() => props.onNavigate('music')} className="px-6 md:px-8 py-3 md:py-4 bg-black/30 backdrop-blur-md border border-white/30 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all text-xs md:text-sm">
                                探索更多
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 w-full space-y-24 md:space-y-32 mt-8">
                    <section className="w-full">
                         <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-white/10 pb-4 w-full px-4 md:px-12 gap-4">
                            <div className="flex flex-col">
                                <h2 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight leading-none">Sonic Layers</h2>
                                <p className="text-xs md:text-sm font-mono text-acid mt-1 tracking-[0.3em]">/// LATEST_AUDIO_DROPS</p>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg backdrop-blur-sm self-start md:self-end overflow-x-auto max-w-full">
                                {[
                                    { id: 'music', label: props.siteConfig?.navLabels.music || '音乐' },
                                    { id: 'video', label: props.siteConfig?.navLabels.video || '影视' },
                                    { id: 'article', label: props.siteConfig?.navLabels.article || '专栏' },
                                    { id: 'gallery', label: props.siteConfig?.navLabels.gallery || '画廊' },
                                    { id: 'dashboard', label: props.siteConfig?.navLabels.dashboard || '工坊' }
                                ].map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => props.onNavigate(item.id)}
                                        className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all uppercase tracking-wider whitespace-nowrap"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <MusicGrid 
                            tracks={props.tracks} 
                            playlists={props.playlists}
                            onPlay={handlePlay} 
                            playingId={playingId} 
                            isHomeView={true} 
                        />
                    </section>

                    <section className="space-y-8 w-full px-4 md:px-12">
                        <SectionHeader title={props.siteConfig?.navLabels.article || "深度专栏"} sub="Editorial_Hub" color="cyber" onMore={() => props.onNavigate('article')} />
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-4 md:p-8 hover:border-cyan-500/30 transition-colors group">
                            <EditorialHub articles={props.articles} onRead={(a) => { setReadingArticle(a); props.onRecordStat('article_view', a.id); }} isHomeView={true} />
                        </div>
                    </section>
                    
                    <section className="space-y-8 w-full px-4 md:px-12">
                        <SectionHeader title={props.siteConfig?.navLabels.gallery || "视觉画廊"} sub="Visual_Arts" color="neon" onMore={() => props.onNavigate('gallery')} />
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-4 md:p-8 hover:border-neon/30 transition-colors group">
                            <GalleryGrid images={props.gallery.slice(0, 8)} />
                        </div>
                    </section>

                    <section className="relative rounded-none md:rounded-[3rem] overflow-hidden bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-y md:border border-white/10 p-8 md:p-24 text-center w-full md:w-[calc(100%-6rem)] mx-auto">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                        <h2 className="text-3xl md:text-7xl font-display font-black mb-6 md:mb-8">AI 创意工坊</h2>
                        <p className="text-sm md:text-xl text-slate-300 max-w-2xl mx-auto mb-8 md:mb-12 font-light">
                            解析音频结构、生成 Suno 提示词、探索音乐 DNA。
                        </p>
                        <button onClick={() => { if(!props.currentUser) { props.onLoginReq(); return; } props.onAnalyze(null as any); }} className="px-8 md:px-12 py-4 md:py-5 bg-white text-black font-bold text-sm md:text-lg rounded-full hover:bg-acid hover:scale-105 transition-all shadow-xl uppercase tracking-widest">
                            开始分析 (需上传文件)
                        </button>
                    </section>
                </div>

                <footer className="mt-24 md:mt-32 border-t border-white/10 bg-[#020202] py-8 md:py-12 text-center text-[10px] md:text-xs text-slate-500 font-mono">
                    NEXUS AUDIO LAB © 2024 SYSTEM CORE // DESIGNED FOR THE FUTURE
                </footer>
            </div>
        );
    };

    return (
        <div className={`min-h-screen bg-[#050505] text-white ${adminMode ? '' : 'pb-0'}`}>
            <AdminLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLoginSubmit} />
            {!adminMode && !readingArticle && (
                <div className="fixed top-0 left-0 w-full z-[100] flex justify-between items-center px-4 md:px-8 py-4 pointer-events-none">
                     {/* Pass pointer-events-auto to navbar children to ensure clicks work */}
                     <div className="pointer-events-auto w-full">
                        <Navbar 
                            onNavigate={props.onNavigate} 
                            onAdmin={handleAdminClick} 
                            onSettings={props.onOpenSettings} 
                            currentView={props.currentView} 
                            transparent={true} 
                            navLabels={props.siteConfig?.navLabels}
                            userControl={<UserMenu user={props.currentUser} onOpenAuth={props.onLoginReq} onLogout={props.onLogout} />}
                        />
                     </div>
                </div>
            )}

            {adminMode ? (
                <AdminPanel 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onExit={() => setAdminMode(false)}
                    tracks={props.tracks}
                    videos={props.videos}
                    articles={props.articles}
                    gallery={props.gallery}
                    categories={props.categories}
                    playlists={props.playlists || []} 
                    siteConfig={props.siteConfig}
                    siteStats={props.siteStats}
                    onUpdateSiteConfig={props.onUpdateSiteConfig}
                    onUpdateTracks={props.onUpdateTracks}
                    onUpdateVideos={props.onUpdateVideos}
                    onUpdateArticles={props.onUpdateArticles}
                    onUpdateGallery={props.onUpdateGallery}
                    onUpdateCategories={props.onUpdateCategories}
                    onUpdatePlaylists={props.onUpdatePlaylists || (() => {})} 
                    onStopGlobalMusic={handleStopGlobalMusic}
                />
            ) : (
                readingArticle ? (
                    <ArticleView 
                        article={readingArticle} 
                        relatedTrack={props.tracks.find(t => t.id === readingArticle.trackId)} 
                        isPlaying={playingId === readingArticle.trackId} 
                        onTogglePlay={() => handlePlay(readingArticle.trackId || null)} 
                        onBack={() => setReadingArticle(null)}
                        onStopGlobalMusic={handleStopGlobalMusic}
                    />
                ) : (
                    <>
                        {props.currentView === 'home' && renderHomeView()}
                        {props.currentView === 'music' && (
                            <div className="min-h-screen bg-black/90 w-full">
                                <MusicGrid 
                                    tracks={props.tracks} 
                                    playlists={props.playlists} 
                                    onPlay={handlePlay} 
                                    playingId={playingId} 
                                />
                            </div>
                        )}
                        {props.currentView === 'video' && <VideoGrid videos={props.videos} onPauseMusic={handleStopGlobalMusic} onRecordStat={(type) => props.onRecordStat(type)} />}
                        {props.currentView === 'article' && (
                            <div className="pt-24 px-4 md:px-8 w-full mx-auto min-h-screen">
                                <SectionHeader title={props.siteConfig?.navLabels.article || "深度专栏"} sub="Editorial_Hub" color="cyber" />
                                <EditorialHub articles={props.articles} onRead={(a) => { setReadingArticle(a); props.onRecordStat('article_view', a.id); }} isHomeView={false} />
                            </div>
                        )}
                        {props.currentView === 'gallery' && (
                            <div className="pt-24 px-4 md:px-8 w-full mx-auto min-h-screen">
                                <SectionHeader title={props.siteConfig?.navLabels.gallery || "视觉画廊"} sub="Visual_Arts" color="neon" />
                                <GalleryGrid images={props.gallery} />
                            </div>
                        )}
                    </>
                )
            )}

            {currentTrack && (
                <audio 
                    ref={audioRef} 
                    src={getAudioSrc(currentTrack)} 
                    autoPlay 
                    preload="metadata"
                    crossOrigin={isCorsRestricted ? undefined : "anonymous"} 
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleSongEnd} // Auto-play next on end
                    onError={(e) => { console.error("Audio playback error:", e); handleNext(); }} 
                    {...{ referrerPolicy: "no-referrer" } as any} 
                    className="hidden"
                />
            )}

            {!adminMode && !readingArticle && (
                <>
                    <GlobalPlayer 
                        track={currentTrack} 
                        playingId={playingId} 
                        currentTime={currentTime} 
                        duration={duration} 
                        mode={playbackMode}
                        onTogglePlay={() => { if(audioRef.current?.paused) audioRef.current.play(); else audioRef.current?.pause(); }}
                        onToggleMode={handleToggleMode}
                        onSeek={handleSeek}
                        onClose={(e) => { e.stopPropagation(); setPlayingId(null); }}
                        onNext={handleNext}
                        onPrev={handlePrev}
                    />
                    
                    <SonicMascot isPlaying={!!playingId && !audioRef.current?.paused} sourceType={currentTrack?.sourceType || null} />
                </>
            )}
        </div>
    );
};
