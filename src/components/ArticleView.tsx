
import React, { useState, useEffect, useRef } from 'react';
import { Article, GalleryTrack } from '../types';

interface ArticleViewProps {
  article: Article;
  relatedTrack?: GalleryTrack;
  isPlaying: boolean; 
  onTogglePlay: () => void; 
  onBack: () => void;
  onStopGlobalMusic: () => void; 
}

// Inline Capsule Player (Header Integration)
const InlineHeaderPlayer = ({ track, onStopGlobalMusic }: { track: GalleryTrack, onStopGlobalMusic: () => void }) => {
    const [playing, setPlaying] = useState(false);
    const [expanded, setExpanded] = useState(false); // New state for expansion
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        
        if (!expanded) {
            setExpanded(true);
            onStopGlobalMusic();
            audioRef.current.play();
            setPlaying(true);
            return;
        }

        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            onStopGlobalMusic(); 
            audioRef.current.play();
            setPlaying(true);
        }
    };

    // Determine source
    const src = track.sourceType === 'netease' 
        ? `https://music.163.com/song/media/outer/url?id=${track.src}.mp3` 
        : track.src;
    
    // Netease CORS fix
    const isCorsRestricted = track.sourceType === 'netease' || track.sourceType === 'qq';

    return (
        <div 
            className={`mt-4 inline-flex items-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-acid/50 rounded-full backdrop-blur-md transition-all duration-500 ease-out cursor-pointer group animate-fade-in overflow-hidden ${expanded ? 'pr-6 pl-2 py-2 gap-3' : 'p-2 w-14 h-14 justify-center hover:scale-105'}`} 
            onClick={toggle}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 border border-white/10 ${playing ? 'bg-acid text-black rotate-180' : 'bg-black text-white'}`}>
                {playing ? (
                    <div className="flex gap-0.5 h-3 items-end">
                        <div className="w-1 bg-black animate-[bounce_1s_infinite]"></div>
                        <div className="w-1 bg-black animate-[bounce_1.2s_infinite]"></div>
                    </div>
                ) : (
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
            </div>
            
            <div className={`flex flex-col min-w-0 transition-all duration-500 ${expanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                <span className="text-[9px] text-acid font-mono uppercase tracking-widest leading-none mb-0.5 whitespace-nowrap">Audio Companion</span>
                <span className={`text-sm font-bold truncate transition-colors whitespace-nowrap ${playing ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{track.title}</span>
            </div>

            <audio 
                ref={audioRef} 
                src={src} 
                crossOrigin={isCorsRestricted ? undefined : "anonymous"}
                onEnded={() => setPlaying(false)}
            />
        </div>
    );
};

export const ArticleView: React.FC<ArticleViewProps> = ({ article, relatedTrack, onBack, onStopGlobalMusic }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderContent = (content: string) => {
      const lines = content.split('\n');
      return lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={index} className="h-6"></div>;

          if (line.startsWith('# ')) {
              return <h2 key={index} className="text-3xl md:text-4xl font-display font-black text-white mt-12 mb-6 tracking-tight leading-none">{line.replace('# ', '')}</h2>;
          }
          if (line.startsWith('## ')) {
              return <h3 key={index} className="text-xl font-bold text-acid mt-10 mb-4 tracking-wide flex items-center gap-3"><span className="w-4 h-px bg-acid"></span>{line.replace('## ', '')}</h3>;
          }
          
          const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
          if (imgMatch) {
              return (
                  <div key={index} className="my-12">
                      <div className="rounded border border-white/10 overflow-hidden relative">
                          <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full object-cover" />
                          <div className="absolute bottom-0 left-0 bg-black/60 backdrop-blur px-3 py-1 text-[10px] text-white font-mono uppercase border-t border-r border-white/10">
                              {imgMatch[1] || 'Figure'}
                          </div>
                      </div>
                  </div>
              );
          }
          
          const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
          return (
              <p key={index} className="text-slate-300 text-lg md:text-xl font-light mb-6 leading-relaxed text-justify mix-blend-screen">
                  {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-white font-bold decoration-acid underline decoration-2 underline-offset-4">{part.slice(2, -2)}</strong>;
                      if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="text-cyan-400 not-italic font-serif italic">{part.slice(1, -1)}</em>;
                      return part;
                  })}
              </p>
          );
      });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto animate-fade-in custom-scrollbar">
        {/* Back Button */}
        <button 
            onClick={onBack}
            className="fixed top-6 right-6 z-[120] w-12 h-12 bg-black/20 backdrop-blur-md border border-white/10 hover:border-acid rounded-full flex items-center justify-center text-white transition-all group"
        >
            <svg className="w-5 h-5 group-hover:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Progress Bar */}
        <div className="fixed top-0 left-0 h-1 bg-acid z-[130]" style={{ width: `${Math.min((scrollY / (document.body.scrollHeight - window.innerHeight)) * 100, 100)}%` }}></div>

        {/* Cinematic Header */}
        <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
            <div className="absolute inset-0">
                <img 
                    src={article.coverUrl} 
                    className="w-full h-full object-cover"
                    style={{ transform: `translateY(${scrollY * 0.5}px) scale(1.1)` }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-20 max-w-5xl mx-auto flex flex-col justify-end h-full">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-2 py-0.5 border border-acid text-acid text-[10px] font-mono uppercase tracking-widest bg-black/50 backdrop-blur">
                        Editorial
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
                        {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                </div>
                
                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white leading-[0.9] mb-6 tracking-tighter text-shadow-lg">
                    {article.title}
                </h1>

                {/* Subtitle & Player Area */}
                <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12 border-l-4 border-acid pl-6">
                     {article.subtitle && (
                        <p className="text-xl md:text-2xl text-slate-200 font-light italic max-w-xl leading-relaxed">
                            {article.subtitle}
                        </p>
                    )}
                    
                    {/* PLACED PLAYER HERE AS REQUESTED */}
                    {relatedTrack && (
                        <div className="md:ml-auto md:mb-1">
                            <InlineHeaderPlayer track={relatedTrack} onStopGlobalMusic={onStopGlobalMusic} />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Content Body */}
        <div className="relative max-w-3xl mx-auto px-6 py-12">
            {/* Meta Row */}
            <div className="flex items-center justify-between border-b border-white/10 pb-8 mb-12">
                <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                         {article.author.substring(0,2).toUpperCase()}
                     </div>
                     <div className="flex flex-col">
                         <span className="text-xs font-bold text-white uppercase tracking-wide">{article.author}</span>
                         <span className="text-[10px] text-slate-500 font-mono">NEXUS SENIOR EDITOR</span>
                     </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Read Time: 5 Min
                </div>
            </div>

            {/* Markdown Content */}
            <div className="font-serif">
                {renderContent(article.content)}
            </div>

            {/* Footer */}
            <div className="mt-24 pt-12 border-t border-white/10 flex flex-col items-center gap-4 opacity-50">
                <div className="w-2 h-2 rounded-full bg-acid"></div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em]">End of Transmission</p>
            </div>
        </div>
    </div>
  );
};
