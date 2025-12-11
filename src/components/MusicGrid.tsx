
// src/components/MusicGrid.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { GalleryTrack, Playlist } from '../types';

// --- UTILS ---

const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

const getRandomDuration = (id: string) => {
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const totalSec = 150 + (seed % 120); 
    return formatTime(totalSec);
};

const PlayIcon = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
);

const PauseIcon = () => (
    <div className="flex gap-1 h-5 items-center justify-center">
        <div className="w-1.5 h-4 bg-current"></div>
        <div className="w-1.5 h-4 bg-current"></div>
    </div>
);

// --- COMPONENTS ---

// 1. HERO CAROUSEL
const HeroCarousel = ({ tracks, onPlay, playingId }: { tracks: GalleryTrack[], onPlay: (id: string, queue: string[]) => void, playingId: string | null }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered || tracks.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % tracks.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [tracks.length, isHovered]);

    if (tracks.length === 0) return null;

    const currentTrack = tracks[currentIndex];
    const isPlaying = playingId === currentTrack.id;

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % tracks.length);
    };

    const handlePlayCurrent = () => {
        onPlay(currentTrack.id, tracks.map(t => t.id));
    };

    return (
        <div 
            className="relative w-full h-[60vh] md:h-[85vh] min-h-[400px] md:min-h-[600px] mb-0 overflow-hidden group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Layers */}
            {tracks.map((track, idx) => (
                <div 
                    key={track.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    <img src={track.coverUrl} className="w-full h-full object-cover blur-[0px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
                </div>
            ))}

            {/* Content Content (Aligned with PX-4 MD:PX-12) */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 md:p-12 pb-24 md:pb-32 w-full">
                <div className="transition-all duration-700 transform translate-y-0 opacity-100 max-w-5xl">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur border border-white/20 text-acid text-[10px] font-black uppercase tracking-[0.2em] rounded">
                            Featured
                        </span>
                        <div className="flex gap-1">
                            {tracks.map((_, idx) => (
                                <div key={idx} className={`w-4 md:w-8 h-1 rounded-full transition-colors ${idx === currentIndex ? 'bg-acid' : 'bg-white/20'}`}></div>
                            ))}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-7xl lg:text-9xl font-display font-black text-white leading-[0.9] md:leading-[0.85] tracking-tighter drop-shadow-2xl mb-4 md:mb-8 line-clamp-2">
                        {currentTrack.title}
                    </h1>

                    <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
                        <div className="flex -space-x-3 md:-space-x-4">
                            <img src={currentTrack.coverUrl} className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-black object-cover" />
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-black bg-white/10 backdrop-blur flex items-center justify-center text-[8px] md:text-[10px] font-bold">
                                {currentTrack.sourceType === 'local' ? 'HIFI' : 'WEB'}
                            </div>
                        </div>
                        <div className="text-lg md:text-2xl text-white font-light tracking-wide">{currentTrack.artist}</div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <button 
                            onClick={handlePlayCurrent} 
                            className={`group relative px-6 md:px-10 py-3 md:py-5 font-bold text-sm md:text-lg uppercase tracking-widest rounded-full flex items-center gap-2 md:gap-4 transition-all shadow-2xl hover:scale-105 overflow-hidden ${isPlaying ? 'bg-acid text-black' : 'bg-white text-black'}`}
                        >
                            <span className="relative z-10 flex items-center gap-2 md:gap-3">
                                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                                <span>{isPlaying ? '暂停播放' : '立即播放'}</span>
                            </span>
                            <div className="absolute inset-0 bg-white/50 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out z-0 skew-x-12"></div>
                        </button>
                        
                        <button onClick={handleNext} className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white text-white transition-all backdrop-blur-md">
                            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. GENRE FILTER (Clouds)
const GenreFilter = () => (
    <div className="w-full border-b border-white/5 bg-[#050505]">
        <div className="w-full px-4 md:px-12 py-4 md:py-6 flex gap-2 md:gap-3 overflow-x-auto hide-scrollbar">
            {['全部', '赛博朋克', '深邃浩室', '合成器波', '氛围音乐', '科技舞曲', '流行', '低保真', '古典'].map((g, i) => (
                <button key={g} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full border text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${i === 0 ? 'bg-white text-black border-white' : 'bg-[#111] text-slate-400 border-white/10 hover:border-acid hover:text-acid hover:bg-white/5'}`}>
                    {g}
                </button>
            ))}
        </div>
    </div>
);

// 3. ARTIST SPOTLIGHT (COMPACT RE-DESIGN)
const ArtistSpotlight = ({ tracks, onSelectArtist, activeArtist }: { tracks: GalleryTrack[], onSelectArtist: (a: string) => void, activeArtist: string | null }) => {
    const uniqueArtists = Array.from(new Set(tracks.map(t => t.artist))).slice(0, 10);

    return (
        <div className="py-4 bg-[#080808] border-b border-white/5 w-full overflow-hidden">
            <div className="w-full px-4 md:px-12 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                
                {/* Title Section (Single Line) */}
                <div className="shrink-0 flex items-center gap-3">
                    <div className="w-1 h-5 bg-acid"></div>
                    <h3 className="text-base md:text-lg font-display font-bold text-white uppercase tracking-wider">推介艺人</h3>
                    <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest pt-0.5">Featured Creators</span>
                </div>
                
                {/* Scrollable List on the Right - Compact Capsules */}
                <div className="flex-1 w-full overflow-x-auto hide-scrollbar -mx-4 md:mx-0 px-4 md:px-0">
                    <div className="flex gap-3 flex-nowrap items-center h-full">
                        {uniqueArtists.map((artist, i) => {
                            const track = tracks.find(t => t.artist === artist);
                            const isActive = activeArtist === artist;
                            
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => onSelectArtist(artist)}
                                    className={`
                                        group relative flex items-center gap-2 pr-4 pl-1 py-1 shrink-0 rounded-full cursor-pointer transition-all duration-300 h-9
                                        border hover:scale-[1.02]
                                        ${isActive 
                                            ? 'bg-acid text-black border-acid shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                                        }
                                    `}
                                >
                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-black/20">
                                        <img src={track?.coverUrl || ""} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wide truncate max-w-[80px]">
                                        {artist}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 4. TRENDING GRID
const TrendingGrid = ({ tracks, onPlay, playingId }: { tracks: GalleryTrack[], onPlay: (id: string, queue: string[]) => void, playingId: string | null }) => {
    const queue = useMemo(() => tracks.map(t => t.id), [tracks]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Show 9 items for better balance */}
            {tracks.slice(0, 9).map((track, i) => {
                const isPlaying = playingId === track.id;
                return (
                    <div 
                        key={track.id} 
                        onClick={() => onPlay(track.id, queue)}
                        className="group relative h-48 md:h-64 rounded-2xl md:rounded-3xl cursor-pointer overflow-hidden border border-white/5 hover:border-acid/50 transition-all duration-500 bg-[#111] hover:scale-[1.01]"
                    >
                        <img src={track.coverUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 p-4 md:p-6 w-full z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-acid font-mono text-[9px] uppercase tracking-widest bg-black/60 backdrop-blur px-2 py-1 rounded border border-acid/20">
                                    #{i + 1} Trending
                                </span>
                            </div>
                            <h3 className="text-lg md:text-xl font-display font-bold text-white mb-1 truncate leading-tight group-hover:text-acid transition-colors">{track.title}</h3>
                            <p className="text-[10px] text-slate-300 font-light uppercase tracking-widest">{track.artist}</p>
                        </div>
                        
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isPlaying ? 'opacity-100 backdrop-blur-none' : ''}`}>
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 ${isPlaying ? 'bg-acid text-black' : 'bg-white text-black'}`}>
                                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// 5. GLOBAL TOP 10 LIST
const GlobalTopChart = ({ tracks, onPlay, playingId }: { tracks: GalleryTrack[], onPlay: (id: string, queue: string[]) => void, playingId: string | null }) => {
    const queue = useMemo(() => tracks.map(t => t.id), [tracks]);

    return (
        <div className="flex flex-col gap-2">
            {tracks.slice(0, 10).map((track, idx) => {
                const isPlaying = playingId === track.id;
                return (
                    <div 
                        key={track.id} 
                        onClick={() => onPlay(track.id, queue)}
                        className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl border transition-all duration-300 cursor-pointer group hover:scale-[1.01] ${isPlaying ? 'bg-white/10 border-acid/50' : 'bg-[#0a0a0a] border-white/5 hover:bg-white/5 hover:border-white/20'}`}
                    >
                        <div className={`text-sm md:text-lg font-display font-bold w-6 text-center ${idx < 3 ? 'text-acid' : 'text-slate-600'}`}>{(idx + 1).toString().padStart(2, '0')}</div>
                        
                        <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden shrink-0 shadow-lg">
                            <img src={track.coverUrl} className="w-full h-full object-cover" />
                            {isPlaying && <div className="absolute inset-0 bg-acid/80 flex items-center justify-center text-black"><PauseIcon /></div>}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <h4 className={`font-bold text-xs truncate ${isPlaying ? 'text-acid' : 'text-white'}`}>{track.title}</h4>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider">{track.artist}</div>
                            </div>
                            
                            {isPlaying && (
                                <div className="hidden md:flex items-center gap-0.5 h-3">
                                    <div className="w-0.5 bg-acid animate-[bounce_1s_infinite]"></div>
                                    <div className="w-0.5 bg-acid animate-[bounce_1.5s_infinite]"></div>
                                    <div className="w-0.5 bg-acid animate-[bounce_0.8s_infinite]"></div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-[9px] md:text-[10px] font-mono text-slate-600 group-hover:text-white transition-colors text-right">{getRandomDuration(track.id)}</div>
                    </div>
                );
            })}
        </div>
    );
};

// 6. CURATED COLLECTIONS (PLAYLIST CARDS)
const CuratedCollections = ({ playlists, tracks, onSelect, onPlay }: { playlists: Playlist[], tracks: GalleryTrack[], onSelect: (id: string) => void, onPlay: (id: string, queue: string[]) => void }) => {
    if (!playlists || playlists.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {playlists.map((pl) => {
                // Get the first few tracks for the mini list
                const plTracks = pl.trackIds.map(tid => tracks.find(t => t.id === tid)).filter(Boolean) as GalleryTrack[];
                const previewTracks = plTracks.slice(0, 3);

                return (
                    <div 
                        key={pl.id} 
                        className="bg-[#111] rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all group flex flex-col h-full"
                    >
                        {/* Banner Header */}
                        <div 
                            className="relative h-24 md:h-28 bg-black overflow-hidden cursor-pointer"
                            onClick={() => onSelect(pl.id)}
                        >
                            <img src={pl.coverUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>
                            
                            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                <div>
                                    <h4 className="text-lg md:text-xl font-display font-bold text-white uppercase leading-none shadow-black drop-shadow-md">{pl.title}</h4>
                                    <span className="text-[10px] text-purple-400 font-mono uppercase mt-1 block">{pl.trackIds.length} Songs</span>
                                </div>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(pl.trackIds.length > 0) onPlay(pl.trackIds[0], pl.trackIds); 
                                    }}
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-acid hover:scale-110 transition-all shadow-lg"
                                >
                                    <PlayIcon />
                                </button>
                            </div>
                        </div>

                        {/* Mini Track List */}
                        <div className="p-3 md:p-4 space-y-1 md:space-y-2 flex-1">
                            {previewTracks.length > 0 ? previewTracks.map((track, idx) => (
                                <div 
                                    key={track.id} 
                                    onClick={() => onPlay(track.id, pl.trackIds)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group/item transition-colors"
                                >
                                    <img src={track.coverUrl} className="w-6 h-6 md:w-8 md:h-8 rounded object-cover opacity-70 group-hover/item:opacity-100" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] md:text-xs font-bold text-slate-300 group-hover/item:text-white truncate">{track.title}</div>
                                        <div className="text-[9px] text-slate-500 uppercase">{track.artist}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-xs text-slate-600">暂无歌曲</div>
                            )}
                            {plTracks.length > 3 && (
                                <div onClick={() => onSelect(pl.id)} className="text-[10px] text-center text-slate-500 hover:text-white cursor-pointer pt-2 border-t border-white/5 uppercase tracking-widest">
                                    查看全部 ({plTracks.length})
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// --- MAIN MUSIC GRID ---

export const MusicGrid = React.memo(({ 
    tracks, 
    playlists,
    onPlay, 
    playingId, 
    isHomeView = false 
}: { 
    tracks: GalleryTrack[], 
    playlists?: Playlist[],
    onPlay: (id:string, queue?: string[])=>void, 
    playingId: string|null, 
    isHomeView?: boolean 
}) => {
    
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

    // Memoize Lists with Filters
    const { heroTracks, topCharts, trending } = useMemo(() => {
        if (tracks.length === 0) return { heroTracks: [], topCharts: [], trending: [] };
        
        const sortedByDate = [...tracks].sort((a, b) => b.addedAt - a.addedAt);
        const hero = tracks.filter(t => t.isHero);
        const finalHero = hero.length > 0 ? hero : sortedByDate.slice(0, 5);
        
        let filtered = tracks;
        
        if (selectedPlaylistId && playlists) {
            const pl = playlists.find(p => p.id === selectedPlaylistId);
            if (pl) {
                filtered = tracks.filter(t => pl.trackIds.includes(t.id));
            }
        } else if (selectedArtist) {
            filtered = tracks.filter(t => t.artist === selectedArtist);
        }

        const shuffle = [...filtered].sort((a, b) => (a.id.charCodeAt(0) + a.title.length) - (b.id.charCodeAt(0) + b.title.length));

        return {
            heroTracks: finalHero,
            topCharts: filtered.slice(0, 10),
            trending: shuffle.slice(0, 9) // Increased to 9 for better layout balance
        };
    }, [tracks, selectedArtist, selectedPlaylistId, playlists]);

    const handleArtistSelect = (artist: string) => {
        setSelectedPlaylistId(null);
        setSelectedArtist(prev => prev === artist ? null : artist);
    };

    const handlePlaylistSelect = (id: string) => {
        setSelectedArtist(null);
        setSelectedPlaylistId(prev => prev === id ? null : id);
    };

    if (tracks.length === 0) return (
        <div className="flex items-center justify-center h-[50vh] text-slate-500 font-mono flex-col gap-4">
            <div className="w-16 h-16 border-2 border-slate-700 rounded-full flex items-center justify-center text-3xl">?</div>
            <p>暂无音频档案 (NO AUDIO ARCHIVES)</p>
        </div>
    );

    const activePlaylist = playlists?.find(p => p.id === selectedPlaylistId);

    return (
        <div className={`w-full ${isHomeView ? 'pb-0' : 'pb-24 md:pb-32'}`}>
            
            {/* HERO - Only show if NOT home view */}
            {!isHomeView && <HeroCarousel tracks={heroTracks} onPlay={onPlay} playingId={playingId} />}
            
            {/* GENRE FILTER - Only show if NOT home view */}
            {!isHomeView && <GenreFilter />}

            {/* ARTIST SPOTLIGHT - Horizontal Layout (Compact) */}
            <ArtistSpotlight tracks={tracks} onSelectArtist={handleArtistSelect} activeArtist={selectedArtist} />

            {/* MAIN CONTENT - Full Width Container */}
            <div className="relative z-20 w-full px-4 md:px-12 space-y-12 md:space-y-20 mt-8">
                
                {/* 1. SPLIT SECTION: Trending Grid & Top Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                         <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-white/10 pb-4 gap-4">
                            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight">时下流行 <span className="text-acid">///</span></h2>
                                    {!isHomeView && <p className="text-[10px] md:text-xs font-mono text-slate-500 mt-1 tracking-widest">GLOBAL ANALYTICS</p>}
                                </div>
                                
                                {isHomeView && (
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar mask-gradient-right pb-1">
                                        {['赛博朋克', '深邃浩室', '合成器波', '氛围', '科技', '流行'].map(g => (
                                            <span key={g} className="text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/30 cursor-pointer whitespace-nowrap transition-colors">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedArtist && (
                                <button onClick={() => setSelectedArtist(null)} className="text-xs text-red-400 hover:text-white uppercase border border-red-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                                    清除艺人筛选: {selectedArtist} ✕
                                </button>
                            )}
                            {activePlaylist && (
                                <button onClick={() => setSelectedPlaylistId(null)} className="text-xs text-purple-400 hover:text-white uppercase border border-purple-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                                    当前歌单: {activePlaylist.title} ✕
                                </button>
                            )}
                         </div>
                         <TrendingGrid tracks={trending} onPlay={onPlay} playingId={playingId} />
                    </div>

                    <div className="lg:col-span-4 space-y-6 md:space-y-8">
                        <div className="flex items-end justify-between border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight">热歌榜单</h2>
                                <p className="text-[10px] md:text-xs font-mono text-slate-500 mt-1 tracking-widest">WEEKLY RANKING</p>
                            </div>
                         </div>
                         <GlobalTopChart tracks={topCharts} onPlay={onPlay} playingId={playingId} />
                    </div>
                </div>

                {/* 2. CURATED COLLECTIONS (NEW LAYOUT) */}
                <div className="space-y-6 md:space-y-8">
                     <div className="flex items-end justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight">精选 <span className="text-purple-500">歌单</span></h2>
                            <p className="text-[10px] md:text-xs font-mono text-slate-500 mt-1 tracking-widest">MOOD & ACTIVITY</p>
                        </div>
                     </div>
                     {playlists && playlists.length > 0 ? (
                        <CuratedCollections playlists={playlists} tracks={tracks} onSelect={handlePlaylistSelect} onPlay={onPlay} />
                     ) : (
                        <p className="text-slate-600 text-sm">暂无精选歌单</p>
                     )}
                </div>

            </div>
        </div>
    );
});
