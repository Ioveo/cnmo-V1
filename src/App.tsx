
// src/App.tsx

import React, { useState, useRef, useEffect } from 'react';
import { AnalysisStatus, AudioAnalysisResult, CreativeGeneratorRequest, GalleryTrack, Video, GalleryImage, Article, Category, Playlist, SiteConfig, SiteStats, User } from './types';
import { analyzeAudioWithGemini, analyzeMusicMetadata, generateCreativeSunoPlan, generateInstantRemix } from './services/geminiService';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { SunoBuilder } from './components/SunoBuilder';
import { CustomGenerator } from './components/CustomGenerator';
import { MusicShowcase } from './components/MusicShowcase';
import SettingsModal from './components/SettingsModal';
import { AuthModal } from './components/AuthUI'; // New Import

// --- HIGH QUALITY PRESET DATA GENERATION ---

// Curated Unsplash IDs for consistent aesthetic (Cyberpunk, Neon, Studio, Abstract)
const COVER_IMAGES = [
    '1614613535308-eb5fbd3d2c17', // Neon Fluid
    '1618005182384-a83a8bd57fbe', // Abstract Liquid
    '1493225255756-d9584f8606e9', // Surfer/Ocean
    '1550684848-fac1c5b4e853',    // Retro Grid
    '1470225620780-dba8ba36b745', // DJ
    '1511671782779-c97d3d27a1d4', // Vinyl
    '1514320291840-2e0a9bf2a9ae', // Concert
    '1492684223066-81342ee5ff30', // Event
    '1506157785451-aa293e98f72c', // Roof Party
    '1533174072545-e8d4aa97d890', // Space
    '1620641788421-7f1c91ade639', // 3D Shape
    '1626814026160-2237a95fc5a0', // Cyber City
];

const PRESET_TRACKS: GalleryTrack[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `p${i}`,
    title: i % 2 === 0 ? `Neon Nights Vol.${i}` : `Cyber Soul ${i}`,
    artist: `Artist ${String.fromCharCode(65 + (i % 5))}`,
    coverUrl: `https://images.unsplash.com/photo-${COVER_IMAGES[i % COVER_IMAGES.length]}?q=80&w=600&auto=format&fit=crop`,
    sourceType: "local",
    src: "", 
    addedAt: Date.now() - i * 3600000,
    isHero: i < 5, // First 5 are heroes
    album: "Future Sounds 2025"
}));

const PRESET_VIDEOS: Video[] = Array.from({ length: 30 }).map((_, i) => {
    const categories = ['科幻', '动画', 'MV', '创意', '纪录片', '电影'];
    const cat = categories[i % categories.length];
    return {
        id: `v${i}`,
        title: `NEXUS CINEMA: ${cat} Vol.${i + 1}`,
        author: `Studio ${String.fromCharCode(65 + (i % 5))}`,
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 
        coverUrl: `https://images.unsplash.com/photo-${COVER_IMAGES[(i + 5) % COVER_IMAGES.length]}?q=80&w=800&auto=format&fit=crop`,
        sourceType: 'external',
        category: cat,
        addedAt: Date.now() - i * 100000,
        isHero: i === 0,
        isVideoPageHero: i === 1,
        description: `Experience high-fidelity playback in the new NEXUS Video Hub. Volume ${i+1}. This is a masterpiece of AI generation.`
    };
});

const PRESET_GALLERY: GalleryImage[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `g${i}`,
    title: `Visual Art ${i + 1}`,
    url: `https://images.unsplash.com/photo-${COVER_IMAGES[(i + 2) % COVER_IMAGES.length]}?q=80&w=800&auto=format&fit=crop`,
    uploadedAt: Date.now() - i * 50000
}));

const PRESET_ARTICLES: Article[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `a${i}`,
    title: i === 0 ? "The Future of AI Music Synthesis: A Deep Dive" : `Editorial Story Vol.${i}`,
    subtitle: `Exploring the boundaries of algorithmic creativity and human expression in the age of generative models.`,
    author: 'NEXUS Editor',
    publishedAt: Date.now() - i * 86400000,
    coverUrl: `https://images.unsplash.com/photo-${COVER_IMAGES[(i + 8) % COVER_IMAGES.length]}?q=80&w=1200&auto=format&fit=crop`,
    content: `# Future Sound ${i}\nExploring the depths of AI audio synthesis. \n\n## Chapter 1\nMusic is evolving.`
}));

const PRESET_CATEGORIES: Category[] = [
    { id: 'c1', name: 'Sci-Fi', type: 'video' },
    { id: 'c2', name: 'Animation', type: 'video' },
    { id: 'c3', name: 'Deep House', type: 'music' },
    { id: 'c4', name: 'Pop', type: 'music' },
    { id: 'c5', name: 'Tech', type: 'article' },
    { id: 'c6', name: 'Culture', type: 'article' }
];

const PRESET_PLAYLISTS: Playlist[] = [
    { id: 'pl_1', title: '专注心流', description: 'Deep Focus & Coding', coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800&auto=format&fit=crop', trackIds: PRESET_TRACKS.slice(0, 8).map(t => t.id), addedAt: Date.now() },
    { id: 'pl_2', title: '午夜驾驶', description: 'Night Drive Vibes', coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800&auto=format&fit=crop', trackIds: PRESET_TRACKS.slice(8, 15).map(t => t.id), addedAt: Date.now() },
    { id: 'pl_3', title: '赛博朋克', description: 'Neon City Lights', coverUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop', trackIds: PRESET_TRACKS.slice(15, 22).map(t => t.id), addedAt: Date.now() },
    { id: 'pl_4', title: '运动能量', description: 'Gym & Workout', coverUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', trackIds: PRESET_TRACKS.slice(22, 30).map(t => t.id), addedAt: Date.now() }
];

// --- ICONS ---
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-lime-400 group-hover:text-lime-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>);
const LinkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>);

// --- INTRO SCREEN ---
const CinematicIntro = ({ onComplete }: { onComplete: () => void }) => {
    const [visible, setVisible] = useState(true);
    const [zoom, setZoom] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setZoom(true), 2500);
        const t2 = setTimeout(() => {
            setVisible(false);
            onComplete();
        }, 3200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className={`fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${zoom ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80"></div>
            <div className={`relative flex items-center justify-center transition-transform duration-[2000ms] ease-in-out ${zoom ? 'scale-[20]' : 'scale-100'}`}>
                <div className="absolute w-40 h-40 rounded-full border border-lime-500/30 animate-ripple"></div>
                <div className="absolute w-40 h-40 rounded-full border border-cyan-500/20 animate-ripple" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lime-500 to-cyan-500 shadow-[0_0_50px_rgba(132,204,22,0.5)] z-10 flex items-center justify-center relative animate-pulse-fast">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
                    <svg className="w-10 h-10 text-black z-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                </div>
            </div>
            <div className={`mt-16 text-center transition-all duration-700 ${zoom ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
                <h1 className="text-6xl font-display font-black text-white tracking-tighter mb-4 animate-fade-in">
                    NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">AUDIO</span>
                </h1>
            </div>
        </div>
    );
};

const LoadingScreen = ({ status }: { status: AnalysisStatus }) => (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
        <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-lime-500 rounded-full animate-spin"></div>
        </div>
        <h3 className="text-2xl font-display text-white tracking-widest uppercase animate-pulse">正在处理</h3>
        <p className="text-lime-400 font-mono text-xs mt-2 uppercase tracking-wide">{status}</p>
    </div>
);

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<'home' | 'music' | 'video' | 'article' | 'gallery' | 'dashboard' | 'builder' | 'custom'>('home');
  const [activeUploadTab, setActiveUploadTab] = useState<'upload' | 'link'>('upload');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysisData, setAnalysisData] = useState<AudioAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remixTags, setRemixTags] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');

  // Data State
  const [tracks, setTracks] = useState<GalleryTrack[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  // Config State
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
      const init = async () => {
          try {
              // Restore User Session
              const user = await authService.getMe();
              setCurrentUser(user);

              // Parallel Load Data
              const [t, v, a, g, c, p, conf, st] = await Promise.all([
                  storageService.getTracks(),
                  storageService.getVideos(),
                  storageService.getArticles(),
                  storageService.getGallery(),
                  storageService.getCategories(),
                  storageService.getPlaylists(),
                  storageService.getSiteConfig(),
                  storageService.getStats()
              ]);
              
              if (t.length === 0) { setTracks(PRESET_TRACKS); await storageService.saveTracks(PRESET_TRACKS); } else setTracks(t);
              if (v.length === 0) { setVideos(PRESET_VIDEOS); await storageService.saveVideos(PRESET_VIDEOS); } else setVideos(v);
              if (a.length === 0) { setArticles(PRESET_ARTICLES); await storageService.saveArticles(PRESET_ARTICLES); } else setArticles(a);
              if (g.length === 0) { setGallery(PRESET_GALLERY); await storageService.saveGallery(PRESET_GALLERY); } else setGallery(g);
              if (c.length === 0) { setCategories(PRESET_CATEGORIES); await storageService.saveCategories(PRESET_CATEGORIES); } else setCategories(c);
              if (p.length === 0) { setPlaylists(PRESET_PLAYLISTS); await storageService.savePlaylists(PRESET_PLAYLISTS); } else setPlaylists(p);
              
              setSiteConfig(conf);
              setSiteStats(st);

              // Record Visit
              storageService.incrementStat('visit');

          } catch(e) {
              console.error("Init failed", e);
              setTracks(PRESET_TRACKS); setVideos(PRESET_VIDEOS); setArticles(PRESET_ARTICLES); setGallery(PRESET_GALLERY); setPlaylists(PRESET_PLAYLISTS);
          }
      };
      init();
  }, []);

  const updateData = (key: string, data: any) => {
      if (key === 'tracks') { setTracks(data); storageService.saveTracks(data); }
      if (key === 'videos') { setVideos(data); storageService.saveVideos(data); }
      if (key === 'articles') { setArticles(data); storageService.saveArticles(data); }
      if (key === 'gallery') { setGallery(data); storageService.saveGallery(data); }
      if (key === 'categories') { setCategories(data); storageService.saveCategories(data); }
      if (key === 'playlists') { setPlaylists(data); storageService.savePlaylists(data); }
  };

  const handleRecordStat = (type: 'visit' | 'music_play' | 'video_play' | 'article_view', id?: string) => {
      storageService.incrementStat(type, id);
      // Optimistically update local stats
      if (siteStats) {
          const newStats = { ...siteStats };
          if (type === 'visit') newStats.visits++;
          if (type === 'music_play') {
              newStats.musicPlays++;
              if (id) {
                  newStats.trackPlays = newStats.trackPlays || {};
                  newStats.trackPlays[id] = (newStats.trackPlays[id] || 0) + 1;
              }
          }
          if (type === 'video_play') {
              newStats.videoPlays++;
              if (id) {
                  newStats.videoPlayDetails = newStats.videoPlayDetails || {};
                  newStats.videoPlayDetails[id] = (newStats.videoPlayDetails[id] || 0) + 1;
              }
          }
          if (type === 'article_view') {
              newStats.articleViews++;
              if (id) {
                  newStats.articleViewDetails = newStats.articleViewDetails || {};
                  newStats.articleViewDetails[id] = (newStats.articleViewDetails[id] || 0) + 1;
              }
          }
          setSiteStats(newStats);
      }
  };

  const handleResetDemoData = async () => {
      setTracks(PRESET_TRACKS); await storageService.saveTracks(PRESET_TRACKS);
      setVideos(PRESET_VIDEOS); await storageService.saveVideos(PRESET_VIDEOS);
      setArticles(PRESET_ARTICLES); await storageService.saveArticles(PRESET_ARTICLES);
      setGallery(PRESET_GALLERY); await storageService.saveGallery(PRESET_GALLERY);
      setCategories(PRESET_CATEGORIES); await storageService.saveCategories(PRESET_CATEGORIES);
      setPlaylists(PRESET_PLAYLISTS); await storageService.savePlaylists(PRESET_PLAYLISTS);
      alert("演示数据已重新加载！");
  };

  const checkAuth = () => {
      if (!currentUser) {
          setIsAuthOpen(true);
          return false;
      }
      return true;
  };

  // --- TOOL HANDLERS ---
  const resetState = () => {
    setStatus(AnalysisStatus.IDLE);
    setAnalysisData(null);
    setErrorMsg(null);
    setLinkInput('');
  };

  const handleFileAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!checkAuth()) return;
      const file = event.target.files?.[0];
      if (!file) return;

      resetState();
      setStatus(AnalysisStatus.PROCESSING_AUDIO);
      try {
          const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
          });
          setStatus(AnalysisStatus.ANALYZING_AI);
          const result = await analyzeAudioWithGemini(base64, file.type);
          
          // Refresh User Credits
          authService.getMe().then(setCurrentUser);

          setAnalysisData(result);
          setStatus(AnalysisStatus.COMPLETE);
          setView('dashboard');
      } catch(e: any) {
          setErrorMsg(e.message);
          setStatus(AnalysisStatus.ERROR);
      }
  };
  
  const handleLinkAnalysis = async () => {
      if (!checkAuth()) return;
      if (!linkInput.trim()) return;
      resetState();
      setStatus(AnalysisStatus.ANALYZING_AI);
      try {
          const result = await analyzeMusicMetadata(linkInput);
          // Refresh User Credits
          authService.getMe().then(setCurrentUser);

          setAnalysisData(result);
          setStatus(AnalysisStatus.COMPLETE);
          setView('dashboard');
      } catch(e: any) {
          setErrorMsg(e.message);
          setStatus(AnalysisStatus.ERROR);
      }
  };

  const handleCreative = async (req: CreativeGeneratorRequest) => {
      if (!checkAuth()) return;
      setStatus(AnalysisStatus.CREATING_PLAN);
      try {
          const res = await generateCreativeSunoPlan(req);
          // Refresh User Credits
          authService.getMe().then(setCurrentUser);

          setAnalysisData(res);
          setStatus(AnalysisStatus.COMPLETE);
          setView('builder');
      } catch(e: any) { setErrorMsg(e.message); setStatus(AnalysisStatus.ERROR); }
  };
  
  const handleInstantRemix = async () => {
      if (!checkAuth()) return;
      if (!analysisData) return;
      setStatus(AnalysisStatus.CREATING_PLAN); 
      try {
          const result = await generateInstantRemix(analysisData);
          // Refresh User Credits
          authService.getMe().then(setCurrentUser);

          setAnalysisData(result);
          setStatus(AnalysisStatus.COMPLETE);
          setView('builder'); 
      } catch (err: any) {
          setErrorMsg(err.message || "生成失败");
          setStatus(AnalysisStatus.ERROR);
      }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-slate-100 font-sans selection:bg-[#ccff00] selection:text-black">
        {showIntro && <CinematicIntro onComplete={() => setShowIntro(false)} />}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onResetDemoData={handleResetDemoData} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={(user) => setCurrentUser(user)} />
        
        {(status === AnalysisStatus.PROCESSING_AUDIO || status === AnalysisStatus.ANALYZING_AI || status === AnalysisStatus.CREATING_PLAN) && (
            <LoadingScreen status={status} />
        )}

        {status === AnalysisStatus.ERROR && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur">
                 <div className="bg-red-950/50 p-8 rounded-xl border border-red-500/50 text-center max-w-md">
                     <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
                     <p className="text-red-200 mb-4">{errorMsg}</p>
                     <button onClick={() => { setStatus(AnalysisStatus.IDLE); setErrorMsg(null); }} className="px-4 py-2 bg-red-600 rounded text-white font-bold">关闭</button>
                 </div>
             </div>
        )}

        {/* --- MAIN PORTAL --- */}
        {['home', 'music', 'video', 'article', 'gallery'].includes(view) && (
            <MusicShowcase 
                currentView={view as 'home' | 'music' | 'video' | 'article' | 'gallery'} 
                tracks={tracks}
                videos={videos}
                articles={articles}
                gallery={gallery}
                categories={categories}
                playlists={playlists}
                siteConfig={siteConfig}
                siteStats={siteStats}
                currentUser={currentUser} // Pass User
                onLoginReq={() => setIsAuthOpen(true)}
                onLogout={() => authService.logout()}
                onRecordStat={handleRecordStat}
                onUpdateSiteConfig={setSiteConfig}
                onUpdateTracks={d => updateData('tracks', d)}
                onUpdateVideos={d => updateData('videos', d)}
                onUpdateArticles={d => updateData('articles', d)}
                onUpdateGallery={d => updateData('gallery', d)}
                onUpdateCategories={d => updateData('categories', d)}
                onUpdatePlaylists={d => updateData('playlists', d)}
                onRefreshUser={setCurrentUser}
                onNavigate={(v) => setView(v as any)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onAnalyze={(file) => {
                     const event = { target: { files: [file] } } as any;
                     handleFileAnalysis(event);
                }}
            />
        )}

        {/* --- TOOL PAGES --- */}
        {['dashboard', 'builder', 'custom'].includes(view) && (
            <div className="min-h-screen relative bg-[#0a0a0a]">
                <div className="fixed top-0 left-0 w-full h-16 bg-black/90 border-b border-white/10 z-50 flex items-center justify-between px-6 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setView('home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                            <span className="p-1 rounded-full bg-white/5 group-hover:bg-white/20"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></span>
                            <span className="text-xs font-bold uppercase tracking-wider">返回首页</span>
                        </button>
                        <div className="h-4 w-px bg-white/10"></div>
                        <span className="text-sm font-mono text-[#ccff00] uppercase tracking-widest">{view === 'dashboard' ? 'Studio 音频工坊' : view === 'custom' ? 'Creative Lab 创意实验室' : 'Builder 复刻构筑台'}</span>
                    </div>
                </div>
                
                <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
                    {view === 'dashboard' && !analysisData && (
                        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in px-4">
                            <div className="text-center mb-16 relative">
                                <h1 className="text-6xl md:text-8xl font-display font-bold text-white relative z-10 tracking-tighter leading-tight glitch" data-text="解构 听觉 灵魂">
                                    解构 <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">听觉 灵魂</span>
                                </h1>
                                <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed mt-4">
                                    深度解析音频节奏、音色与作曲结构。<br/>
                                    或在 <button onClick={() => setView('custom')} className="text-pink-400 hover:text-pink-300 font-bold border-b border-pink-500/50 hover:border-pink-300">创意实验室</button> 中由 AI 自动生成全曲词曲代码。
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mb-16">
                                <div onClick={() => setActiveUploadTab('upload')} className={`flex-1 group cursor-pointer relative overflow-hidden rounded-2xl border transition-all duration-300 ${activeUploadTab === 'upload' ? 'bg-white/5 border-lime-500/50 shadow-[0_0_40px_rgba(132,204,22,0.15)] scale-[1.02]' : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                                    {activeUploadTab === 'upload' && <div className="absolute top-0 left-0 w-full h-1 bg-lime-500 shadow-[0_0_10px_#84cc16]"></div>}
                                    <div className="p-10 flex flex-col items-center text-center h-full">
                                        <div className="mb-6 p-4 rounded-full bg-white/5 group-hover:bg-lime-500/10 transition-colors border border-white/5 group-hover:border-lime-500/30"><UploadIcon /></div>
                                        <h3 className="text-2xl font-display font-bold text-white mb-2">上传音频文件</h3>
                                        <p className="text-slate-500 text-sm mb-6">分析本地文件 (MP3, WAV, FLAC)</p>
                                        {activeUploadTab === 'upload' && (<div onClick={() => { if(!checkAuth()) return; fileInputRef.current?.click() }} className="mt-auto w-full py-4 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-bold tracking-wide uppercase transition-transform active:scale-95 shadow-lg shadow-lime-500/20">选择文件</div>)}
                                        <input type="file" ref={fileInputRef} onChange={handleFileAnalysis} accept="audio/*" className="hidden" />
                                    </div>
                                </div>

                                <div onClick={() => setActiveUploadTab('link')} className={`flex-1 group cursor-pointer relative overflow-hidden rounded-2xl border transition-all duration-300 ${activeUploadTab === 'link' ? 'bg-white/5 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] scale-[1.02]' : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                                    {activeUploadTab === 'link' && <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>}
                                    <div className="p-10 flex flex-col items-center text-center h-full">
                                        <div className="mb-6 p-4 rounded-full bg-white/5 group-hover:bg-cyan-500/10 transition-colors border border-white/5 group-hover:border-cyan-500/30"><LinkIcon /></div>
                                        <h3 className="text-2xl font-display font-bold text-white mb-2">链接 / 搜索</h3>
                                        <p className="text-slate-500 text-sm mb-6">通过歌名或链接分析云端数据</p>
                                        {activeUploadTab === 'link' && (
                                            <div className="mt-auto w-full flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                <input type="text" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="例如：周杰伦 - 晴天" className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600" onKeyDown={(e) => e.key === 'Enter' && handleLinkAnalysis()}/>
                                                <button onClick={handleLinkAnalysis} className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 rounded-lg font-bold">开始</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'dashboard' && analysisData && (
                        <AnalysisDisplay 
                            data={analysisData} 
                            onReset={() => { setAnalysisData(null); }} 
                            onOpenBuilder={() => setView('builder')} 
                            onRemixStyle={(tags) => { setRemixTags(tags); setView('custom'); }} 
                            onInstantRemix={handleInstantRemix} 
                        />
                    )}
                    {view === 'builder' && analysisData && (
                        <SunoBuilder 
                            data={analysisData} 
                            onBack={() => setView('dashboard')} 
                        />
                    )}
                    {view === 'custom' && (
                        <CustomGenerator 
                            onGenerate={handleCreative} 
                            isLoading={status === AnalysisStatus.CREATING_PLAN} 
                            initialTags={remixTags}
                        />
                    )}
                </div>
            </div>
        )}
    </div>
  );
}

export default App;
