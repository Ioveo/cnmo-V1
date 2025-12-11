
// src/components/LyricsView.tsx

import React, { useEffect, useRef, useState } from 'react';

interface LyricsViewProps {
  title: string;
  artist: string;
  coverUrl: string;
  lyrics?: string;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose: () => void;
}

interface LrcLine {
  time: number;
  text: string;
}

export const LyricsView: React.FC<LyricsViewProps> = ({ 
  title, 
  artist, 
  coverUrl, 
  lyrics, 
  currentTime, 
  onSeek,
  onClose 
}) => {
  const [parsedLyrics, setParsedLyrics] = useState<LrcLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlainText, setIsPlainText] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse LRC
  useEffect(() => {
    if (!lyrics) {
        setParsedLyrics([]);
        setIsPlainText(false);
        return;
    }

    const lines = lyrics.split('\n');
    const parsed: LrcLine[] = [];
    const timeRegex = /\[(\d{1,3}):(\d{1,2})\.?(\d{0,3})\]/;
    
    let hasTimestamps = false;

    lines.forEach(line => {
      const match = line.match(timeRegex);
      if (match) {
        hasTimestamps = true;
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        let msStr = match[3];
        let ms = 0;
        if (msStr) {
             ms = parseInt(msStr);
             if (msStr.length === 2) ms *= 10;
        }
        
        const time = min * 60 + sec + ms / 1000;
        const text = line.replace(timeRegex, '').trim();
        if (text) {
            parsed.push({ time, text });
        }
      }
    });

    if (!hasTimestamps && lines.length > 0) {
        // Fallback to plain text
        setIsPlainText(true);
        const plainLines = lines.map((text, i) => ({ time: i, text: text.trim() })).filter(l => l.text);
        setParsedLyrics(plainLines);
    } else {
        setIsPlainText(false);
        setParsedLyrics(parsed);
    }
  }, [lyrics]);

  // Sync Active Line
  useEffect(() => {
    if (parsedLyrics.length === 0 || isPlainText) return;
    
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
        if (currentTime >= parsedLyrics[i].time) {
            index = i;
        } else {
            break;
        }
    }
    if (index !== activeIndex) {
        setActiveIndex(index);
    }
  }, [currentTime, parsedLyrics, isPlainText]);

  // Auto Scroll
  useEffect(() => {
      if (isPlainText) return;
      if (containerRef.current && parsedLyrics.length > 0) {
          const activeEl = containerRef.current.children[activeIndex] as HTMLElement;
          if (activeEl) {
              activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeIndex, isPlainText]);

  // Common UI Wrapper
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <div className="fixed inset-0 z-[120] bg-[#050505] flex flex-col animate-fade-in overflow-hidden">
          {/* Moving Mesh Gradient Background */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-blue-900/40 animate-aurora"></div>
                <img src={coverUrl} className="w-full h-full object-cover blur-[150px] opacity-60 mix-blend-screen" />
                <div className="absolute inset-0 bg-black/50"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
              {children}
          </div>
      </div>
  );

  // Close Button
  const CloseBtn = () => (
      <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-md border border-white/5 absolute top-6 right-6 z-50">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
  );

  if (!lyrics && parsedLyrics.length === 0) {
      return (
        <Wrapper>
            <CloseBtn />
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-72 h-72 rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] mb-8 border border-white/10 animate-float">
                    <img src={coverUrl} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-4xl font-display font-black text-white mb-2 tracking-tight">{title}</h2>
                <p className="text-xl text-slate-400 mb-8 font-light">{artist}</p>
                <div className="px-6 py-3 rounded-full bg-white/5 text-slate-500 font-mono text-xs border border-white/5">
                    LYRICS NOT AVAILABLE
                </div>
            </div>
        </Wrapper>
      );
  }

  return (
    <Wrapper>
        {/* Header */}
        <div className="px-8 py-8 flex justify-between items-start">
             <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-acid rounded-full animate-pulse"></span>
                    <span className="text-xs font-mono text-acid uppercase tracking-widest">Now Playing</span>
                 </div>
                 <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                 <p className="text-lg text-slate-400 font-light">{artist}</p>
             </div>
             <CloseBtn />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-32 p-4 lg:p-16 overflow-hidden">
            
            {/* Left: Cover Art (Floating) */}
            <div className="hidden lg:flex flex-col items-center justify-center w-1/3 max-w-[500px]">
                <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-white/10 relative group">
                    <img src={coverUrl} className="w-full h-full object-cover" />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
            </div>

            {/* Right: Scrolling Lyrics */}
            <div className="w-full lg:w-1/2 h-full max-h-[70vh] relative">
                {/* Mask gradients for smooth fade */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#050505]/0 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050505]/0 to-transparent z-10 pointer-events-none"></div>

                <div 
                    ref={containerRef} 
                    className="h-full overflow-y-auto custom-scrollbar px-4 py-[40vh] space-y-10 text-center lg:text-left"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {parsedLyrics.map((line, i) => {
                        const isActive = isPlainText ? true : i === activeIndex;
                        return (
                            <p 
                                key={i}
                                onClick={() => !isPlainText && onSeek(line.time)}
                                className={`
                                    cursor-pointer transition-all duration-700 ease-out origin-left
                                    ${isActive 
                                        ? (isPlainText ? 'text-xl text-slate-300 font-light' : 'text-3xl md:text-5xl font-bold text-white scale-100 blur-0 opacity-100 leading-tight') 
                                        : 'text-xl md:text-3xl font-medium text-slate-500/60 blur-[1px] hover:blur-0 hover:text-slate-300 hover:opacity-80'
                                    }
                                `}
                            >
                                {line.text}
                            </p>
                        );
                    })}
                    <div className="h-[20vh]"></div>
                </div>
            </div>
        </div>
    </Wrapper>
  );
};
