
import React from 'react';
import { AudioAnalysisResult, SongSection } from '../types';

interface AnalysisDisplayProps {
  data: AudioAnalysisResult;
  onReset: () => void;
  onOpenBuilder: () => void;
  onRemixStyle: (tags: string[]) => void;
  onInstantRemix: () => void;
}

// --- HIGH-END WIDGETS ---

// 1. BPM Widget
const BpmWidget: React.FC<{ bpm: number; timeSig: string }> = ({ bpm, timeSig }) => {
    const beatDuration = 60 / (bpm || 100); 
    
    return (
        <div className="relative overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 group hover:border-lime-500/50 transition-all duration-500 h-full min-h-[140px] md:min-h-[160px] flex flex-col justify-between">
            <div 
                className="absolute right-[-20%] top-[-20%] w-[150px] h-[150px] rounded-full border border-lime-500/20 opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ animation: `ping ${beatDuration}s cubic-bezier(0, 0, 0.2, 1) infinite` }}
            ></div>
            <div className="relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-lime-500 mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
                    Tempo
                </span>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter">{Math.round(bpm)}</span>
                    <span className="text-xs md:text-sm font-mono text-slate-500">BPM</span>
                </div>
            </div>
            <div className="relative z-10 mt-2 md:mt-4 text-right">
                 <span className="text-lg font-display font-bold text-white">{timeSig}</span>
            </div>
        </div>
    );
};

// 2. Key Widget
const KeyWidget: React.FC<{ tonality: string }> = ({ tonality }) => {
    const parts = tonality.split(' ');
    const root = parts[0] || "?";
    const scale = parts.slice(1).join(' ') || "";

    return (
        <div className="relative overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 group hover:border-purple-500/50 transition-all duration-500 h-full min-h-[140px] md:min-h-[160px] flex items-center justify-between">
            <div className="relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-500 mb-2 block">Key</span>
                <span className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter block">{root}</span>
                <span className="text-sm md:text-lg font-mono text-purple-300 tracking-wide block">{scale}</span>
            </div>
        </div>
    );
};

// 3. Energy Widget
const EnergyWidget: React.FC<{ energy: number }> = ({ energy }) => {
    return (
        <div className="relative overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 group hover:border-orange-500/50 transition-all duration-500 h-full min-h-[140px] md:min-h-[160px] flex items-center gap-4 md:gap-6">
            <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500 mb-1">Intensity</span>
                <span className="text-xl md:text-2xl font-display font-bold text-white">
                    {energy > 80 ? "PEAK" : energy > 50 ? "HIGH" : "LOW"}
                </span>
                <span className="text-xs text-slate-400 mt-1">{energy}%</span>
            </div>
        </div>
    );
};

// 4. Genre Widget
const GenreWidget: React.FC<{ genre: string }> = ({ genre }) => {
    return (
        <div className="relative overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 group hover:border-cyan-500/50 transition-all duration-500 h-full min-h-[140px] md:min-h-[160px] flex flex-col justify-center">
            <div className="relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-500 mb-2 block">Genre</span>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white leading-none break-words">
                    {genre.split(' ')[0]}
                </h3>
                <span className="text-xs md:text-sm font-mono text-cyan-300/70 mt-1 block">
                    {genre.split(' ').slice(1).join(' ')}
                </span>
            </div>
        </div>
    );
};

const SectionTimelineNode: React.FC<{ section: SongSection; index: number; isLast: boolean }> = ({ section, index, isLast }) => {
    let colorClass = "text-slate-400";
    let borderColor = "border-slate-700";
    
    if (section.name.toLowerCase().includes("chorus") || section.name.includes("副歌")) {
        colorClass = "text-pink-400";
        borderColor = "border-pink-500";
    } else if (section.name.toLowerCase().includes("verse") || section.name.includes("主歌")) {
        colorClass = "text-cyan-400";
        borderColor = "border-cyan-500";
    }

    return (
        <div className="flex gap-4 md:gap-6 relative group">
            {!isLast && (
                <div className="absolute left-[15px] md:left-[19px] top-10 bottom-[-24px] w-[2px] bg-gradient-to-b from-white/10 to-transparent z-0 dashed-line"></div>
            )}
            
            <div className={`relative z-10 w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-lg md:rounded-xl bg-[#0a0a0a] border ${borderColor} flex items-center justify-center transition-all shadow-lg`}>
                <span className="text-[10px] font-bold text-white font-mono">{index + 1}</span>
            </div>

            <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4 md:p-5 mb-6 backdrop-blur-sm">
                <div className="flex flex-wrap items-baseline justify-between mb-2">
                    <h4 className={`text-base md:text-xl font-display font-bold ${colorClass} tracking-wide`}>{section.name}</h4>
                    <span className="text-[9px] md:text-[10px] font-mono py-1 px-2 rounded bg-black/50 text-slate-300 border border-white/10 uppercase">
                        {section.energyLevel}
                    </span>
                </div>
                
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-4 border-l-2 border-white/10 pl-3">
                    {section.description}
                </p>

                <div className="bg-black/40 p-3 rounded border border-white/5">
                    <span className="block text-[9px] uppercase text-yellow-500 mb-1">Suno Directive</span>
                    <code className="text-yellow-100 font-mono text-[10px] md:text-xs truncate block">{section.sunoDirective}</code>
                </div>
            </div>
        </div>
    );
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data, onReset, onOpenBuilder, onRemixStyle, onInstantRemix }) => {
  const handleRemix = () => {
      const tags = [...data.genre.split(' '), ...data.mood, `BPM: ${Math.round(data.bpm)}`].slice(0, 8);
      onRemixStyle(tags);
  };

  return (
    <div className="w-full pb-24 max-w-[1600px] mx-auto">
      
      {/* --- HERO SECTION --- */}
      <div className="relative mb-12 pt-6 md:pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-end">
              
              {/* Visualizer */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                 <div className="relative w-48 md:w-full aspect-square max-w-md mx-auto lg:mx-0 group">
                     <div className="absolute inset-0 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl flex items-center justify-center overflow-hidden">
                         <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-lime-500/10 to-blue-500/10 animate-pulse"></div>
                         <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 flex items-center justify-center animate-spin-slow">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-lime-600 to-cyan-600"></div>
                         </div>
                     </div>
                 </div>
              </div>

              {/* Info & Actions */}
              <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left">
                  <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-[10px] font-mono text-lime-400 mb-4 uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                          Analysis Complete
                      </div>
                      <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-bold text-white leading-none tracking-tight mb-2">
                        {data.trackInfo?.title || "Unknown Track"}
                      </h1>
                      <p className="text-lg md:text-2xl lg:text-3xl text-slate-400 font-light tracking-wide">
                        {data.trackInfo?.artist || "Audio File Analysis"}
                      </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {data.mood.map((m, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 uppercase font-mono">
                              {m}
                          </span>
                      ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button 
                        onClick={onInstantRemix}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold font-display tracking-widest uppercase rounded-xl hover:scale-[1.02] transition-transform text-sm"
                      >
                          ⚡️ 生成同款神曲
                      </button>
                      <button 
                        onClick={onOpenBuilder}
                        className="flex-1 px-6 py-4 bg-white text-black font-bold font-display tracking-widest uppercase rounded-xl hover:scale-[1.02] transition-transform text-sm"
                      >
                          进入复刻台
                      </button>
                      <button 
                        onClick={handleRemix}
                        className="px-6 py-4 bg-[#0a0a0a] border border-white/20 text-white font-bold rounded-xl hover:border-pink-500 hover:text-pink-500 transition-colors"
                      >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* --- GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <BpmWidget bpm={data.bpm} timeSig={data.timeSignature} />
          <KeyWidget tonality={data.key} />
          <EnergyWidget energy={data.energy} />
          <GenreWidget genre={data.genre} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Timeline */}
          <div className="lg:col-span-2">
              <div className="flex items-end justify-between mb-6 border-b border-white/10 pb-4">
                  <h3 className="text-xl md:text-2xl font-display font-bold text-white">结构全析</h3>
              </div>
              <div className="space-y-0 pl-1 md:pl-2">
                  {data.sections.map((section, idx) => (
                      <SectionTimelineNode key={idx} section={section} index={idx} isLast={idx === data.sections.length - 1} />
                  ))}
              </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8">
                  <h3 className="text-lg font-display font-bold text-white mb-4">AI 深度简报</h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-6 mb-6 text-justify font-light">{data.description}</p>
                  <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                          <span className="text-[10px] font-mono uppercase text-slate-500 mb-1 block">Rhythmic DNA</span>
                          <p className="text-xs text-slate-200">{data.rhythmAnalysis}</p>
                      </div>
                  </div>
              </div>
              <div className="text-center pt-4">
                  <button onClick={onReset} className="text-xs text-slate-600 hover:text-white uppercase tracking-widest">Close Analysis</button>
              </div>
          </div>
      </div>
    </div>
  );
};