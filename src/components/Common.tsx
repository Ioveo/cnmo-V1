// src/components/Common.tsx
import React, { useState, useEffect } from 'react';
import { GalleryTrack } from '../types';
import { storageService } from '../services/storageService';

// --- VISUAL COMPONENTS ---

export const Marquee = ({ text, reverse = false, opacity = 1 }: { text: string, reverse?: boolean, opacity?: number }) => (
    <div className="relative flex overflow-hidden py-2 bg-transparent pointer-events-none select-none z-0" style={{ opacity }}>
        <div className={`animate-${reverse ? 'marquee-reverse' : 'marquee'} whitespace-nowrap flex gap-8 items-center`}>
            {Array(10).fill(0).map((_, i) => (
                <span key={i} className="text-[4rem] md:text-[8rem] font-display font-black text-white/5 uppercase leading-none">
                    {text}
                </span>
            ))}
        </div>
    </div>
);

export const BentoCard = ({ children, className = "", onClick }: { children?: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`bg-[#080808] border border-white/10 p-6 relative overflow-hidden group hover:border-acid/50 transition-all duration-300 ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 group-hover:border-acid transition-colors"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 group-hover:border-acid transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 group-hover:border-acid transition-colors"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 group-hover:border-acid transition-colors"></div>
        {children}
    </div>
);

export const SectionHeader = ({ title, sub, onMore, color="acid" }: { title: string, sub: string, onMore?: () => void, color?: string }) => {
    const colorClass = color === 'acid' ? 'text-acid' : color === 'neon' ? 'text-neon' : color === 'cyber' ? 'text-cyber' : 'text-orange-500';
    const bgClass = color === 'acid' ? 'bg-acid' : color === 'neon' ? 'bg-neon' : color === 'cyber' ? 'bg-cyber' : 'bg-orange-500';

    return (
        <div className="flex items-end justify-between mb-8 pb-2 border-b border-white/10 relative group">
            <div className={`absolute bottom-[-1px] left-0 w-12 h-[3px] ${bgClass} group-hover:w-full transition-all duration-700 ease-out`}></div>
            <div className="flex flex-col">
                <h2 className="text-2xl md:text-5xl font-display font-black text-white tracking-tighter uppercase leading-[0.85]">
                    {title}
                </h2>
                <div className={`text-[9px] md:text-[10px] font-mono font-bold tracking-[0.3em] uppercase mt-2 flex items-center gap-2 ${colorClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${bgClass} animate-pulse-fast`}></span>
                    {sub}
                </div>
            </div>
            {onMore && (
                <button onClick={onMore} className="hidden md:flex items-center gap-2 px-6 py-2 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-black hover:bg-white transition-all rounded-full hover:px-8">
                    查看全部 <span className="text-xs">&rarr;</span>
                </button>
            )}
        </div>
    );
};

// --- MODALS & NAV ---

export const AdminLoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (pwd: string) => Promise<boolean> }) => {
    const [pwd, setPwd] = useState('');
    const [error, setError] = useState(false);
    
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onLogin(pwd);
        if (success) { onClose(); setPwd(''); setError(false); } else { setError(true); setPwd(''); }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
             <div className="w-full max-w-sm bg-[#0a0a0a] border border-acid/30 p-8 relative shadow-[0_0_50px_rgba(204,255,0,0.1)]">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                 <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest text-center mb-8">System Access</h3>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="输入密钥..." className="w-full bg-black border border-white/20 p-3 text-center text-white font-mono tracking-[0.5em] focus:border-acid outline-none transition-colors" autoFocus />
                     {error && <p className="text-center text-red-500 text-xs font-mono animate-pulse">ACCESS DENIED</p>}
                     <button type="submit" className="w-full py-3 bg-acid text-black font-bold uppercase tracking-widest hover:bg-white transition-colors">UNLOCK</button>
                 </form>
             </div>
        </div>
    );
};

export const FileSelectorModal = ({ isOpen, onClose, onSelect, filter }: { isOpen: boolean, onClose: () => void, onSelect: (url: string) => void, filter: 'video' | 'audio' | 'image' }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            storageService.listFiles().then(data => {
                const filtered = data.filter((f: any) => {
                    const ext = f.key.split('.').pop()?.toLowerCase();
                    if (filter === 'video') return ['mp4', 'webm', 'mov'].includes(ext);
                    if (filter === 'audio') return ['mp3', 'wav', 'flac', 'ogg'].includes(ext);
                    if (filter === 'image') return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                    return true;
                });
                setFiles(filtered);
                setLoading(false);
            });
        }
    }, [isOpen, filter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
            <div className="w-full max-w-4xl bg-[#111] border border-white/10 rounded-xl flex flex-col h-[80vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a] rounded-t-xl">
                    <h3 className="text-lg font-bold text-white">选择文件 ({filter})</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="text-center text-slate-500 py-10">Loading Library...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {files.map(f => (
                                <div 
                                    key={f.key} 
                                    onClick={() => { onSelect(`/api/file/${f.key}`); onClose(); }}
                                    className="p-3 bg-black border border-white/10 rounded-lg hover:border-acid/50 cursor-pointer group transition-all"
                                >
                                    <div className="aspect-square bg-[#222] rounded mb-2 flex items-center justify-center overflow-hidden">
                                        {filter === 'image' ? (
                                            <img src={`/api/file/${f.key}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl text-slate-600 font-bold group-hover:text-acid">{f.key.split('.').pop()}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-300 truncate mb-1">{f.key}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ))}
                            {files.length === 0 && <p className="col-span-full text-center text-slate-500 py-10">暂无相关文件</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const Navbar = ({ onNavigate, onAdmin, onSettings, currentView, transparent = false, navLabels, userControl }: any) => {
    const labels = navLabels || { home: '主控台', video: '影视中心', music: '精选音乐', article: '深度专栏', gallery: '视觉画廊', dashboard: '工坊' };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const handleNav = (id: string) => {
        onNavigate(id);
        setMobileMenuOpen(false);
    }

    return (
        <>
            <nav className={`fixed top-0 left-0 w-full z-[100] flex justify-between items-center px-4 md:px-8 py-4 transition-all duration-300 ${transparent ? 'bg-transparent border-transparent' : 'bg-[#050505]/80 backdrop-blur-md border-b border-white/5'}`}>
                <div onClick={() => handleNav('home')} className="cursor-pointer group flex items-center gap-2 shrink-0">
                     <div className="w-6 h-6 bg-acid rounded-sm shadow-[0_0_10px_#ccff00]"></div>
                     <div className="font-display font-black text-2xl tracking-tighter text-white leading-none drop-shadow-md">NEXUS</div>
                </div>
                
                {/* Desktop Menu */}
                <div className="hidden xl:flex items-center gap-1">
                    {[
                        {id: 'home', label: labels.home},
                        {id: 'video', label: labels.video},
                        {id: 'music', label: labels.music},
                        {id: 'article', label: labels.article},
                        {id: 'gallery', label: labels.gallery}
                    ].map(v => (
                         <button key={v.id} onClick={() => handleNav(v.id)} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all clip-path-slant ${currentView === v.id ? 'bg-white text-black' : 'text-slate-400 hover:text-acid hover:text-black hover:bg-white/90 shadow-sm'}`}>
                            {v.label}
                         </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden lg:block">
                        <button onClick={() => handleNav('dashboard')} className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-acid px-3 py-2">
                            {labels.dashboard}
                        </button>
                    </div>
                    
                    {/* User Control */}
                    <div className="flex items-center">
                         {userControl}
                    </div>

                    <div className="h-4 w-px bg-white/10 hidden md:block"></div>

                    {/* Admin Button */}
                    <button onClick={onAdmin} className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-acid/50 text-slate-400 hover:text-acid transition-colors bg-black/50 backdrop-blur rounded" title="管理员面板">⚙</button>
                    
                    {/* Removed Settings (Wrench) Button as requested */}
                    
                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="xl:hidden w-8 h-8 flex items-center justify-center border border-white/10 text-white bg-black/50 backdrop-blur rounded">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
                    </button>
                </div>
            </nav>

            {/* Mobile Fullscreen Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 animate-fade-in xl:hidden">
                    {[
                        {id: 'home', label: labels.home},
                        {id: 'video', label: labels.video},
                        {id: 'music', label: labels.music},
                        {id: 'article', label: labels.article},
                        {id: 'gallery', label: labels.gallery},
                        {id: 'dashboard', label: labels.dashboard}
                    ].map(v => (
                         <button key={v.id} onClick={() => handleNav(v.id)} className={`text-2xl font-display font-black uppercase tracking-widest transition-all ${currentView === v.id ? 'text-acid' : 'text-white hover:text-slate-400'}`}>
                            {v.label}
                         </button>
                    ))}
                </div>
            )}
        </>
    );
};

export const GlobalPlayer = ({ 
    track, 
    playingId, 
    currentTime, 
    duration, 
    mode,
    onTogglePlay, 
    onToggleMode,
    onSeek, 
    onClose,
    onNext,
    onPrev
}: any) => {
    if (!playingId) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[150] animate-slide-up md:left-1/2 md:-translate-x-1/2 md:w-[95%] md:max-w-4xl md:bottom-6">
            <div className="bg-[#111]/90 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-full h-16 md:h-20 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex items-center justify-between px-3 md:px-2 relative group overflow-hidden">
                    
                    {/* LEFT: Cover & Info */}
                    <div className="flex items-center gap-3 md:gap-4 md:pl-2 w-[60%] md:w-[30%]">
                        <div className="relative shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/10 bg-black z-10 shadow-lg">
                            <img src={track?.coverUrl} className="w-full h-full object-cover opacity-90 animate-[spin_8s_linear_infinite]" />
                        </div>
                        <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
                            <h4 className="text-white font-bold text-xs md:text-sm truncate pr-2">{track?.title}</h4>
                            <span className="text-[10px] text-acid font-mono uppercase truncate tracking-wide">{track?.artist}</span>
                        </div>
                    </div>

                    {/* CENTER: Controls */}
                    <div className="flex items-center gap-3 md:gap-6 z-20 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
                        <div className="hidden md:flex items-center gap-6">
                            <button onClick={onToggleMode} className="text-slate-500 hover:text-acid transition-colors p-2" title="切换模式">
                                {mode === 'loop' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                                {mode === 'single' && <div className="relative"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><span className="absolute -top-1 -right-1 text-[8px] font-bold bg-acid text-black rounded-full w-3 h-3 flex items-center justify-center">1</span></div>}
                                {mode === 'shuffle' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                            </button>
                            <button onClick={onPrev} className="text-slate-400 hover:text-white hover:scale-110 transition-all p-2" title="上一首">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                            </button>
                        </div>
                        <button 
                            onClick={onTogglePlay} 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white hover:bg-acid text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_#ccff00] hover:scale-105 transition-all"
                        >
                            {playingId ? (
                                <div className="flex gap-1 h-3 md:h-4 items-center">
                                    <div className="w-1 md:w-1.5 h-full bg-black"></div>
                                    <div className="w-1 md:w-1.5 h-full bg-black"></div>
                                </div>
                            ) : (
                                <svg className="w-4 h-4 md:w-5 md:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            )}
                        </button>
                        <button onClick={onNext} className="md:hidden text-slate-400 hover:text-white p-2">
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                        <button onClick={onNext} className="hidden md:block text-slate-400 hover:text-white hover:scale-110 transition-all p-2" title="下一首">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                    </div>

                    {/* RIGHT: Time & Actions */}
                    <div className="hidden md:flex items-center gap-4 justify-end w-[30%] pr-4 z-10">
                        <span className="text-[10px] text-slate-500 font-mono hidden md:inline-block tracking-wider">
                            {Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')} <span className="mx-1 opacity-30">/</span> {Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}
                        </span>
                        <div className="h-6 w-px bg-white/10 mx-1"></div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all">
                            ✕
                        </button>
                    </div>
                    
                    <button onClick={onClose} className="md:hidden p-2 text-slate-500 hover:text-white">✕</button>

                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5 cursor-pointer group-hover:h-[5px] transition-all z-0" onClick={onSeek}>
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-acid transition-all duration-100 ease-linear shadow-[0_0_10px_#ccff00]" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                    </div>
            </div>
        </div>
    );
};
