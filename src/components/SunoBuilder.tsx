
import React, { useState, useEffect } from 'react';
import { AudioAnalysisResult } from '../types';
import { generateSectionLyrics } from '../services/geminiService';

interface SunoBuilderProps {
  data: AudioAnalysisResult;
  onBack: () => void;
}

const QUICK_COMMANDS = [
  { label: "指令速查...", value: "" },
  { label: "[Drop]", value: "Drop" },
  { label: "[Bass Drop]", value: "Bass Drop" },
  { label: "[Instrumental Solo]", value: "Instrumental Solo" },
  { label: "[Guitar Solo]", value: "Guitar Solo" },
  { label: "[Spoken Word]", value: "Spoken Word" },
  { label: "[Rap Verse]", value: "Rap Verse" },
  { label: "[Chorus]", value: "Chorus" },
  { label: "[Build Up]", value: "Build Up" },
  { label: "[Silence]", value: "Silence" },
  { label: "[Fade Out]", value: "Fade Out" },
  { label: "[End]", value: "End" },
];

export const SunoBuilder: React.FC<SunoBuilderProps> = ({ data, onBack }) => {
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [directives, setDirectives] = useState<string[]>([]);
  const [stylePrompt, setStylePrompt] = useState("");
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});
  const [loadingLyrics, setLoadingLyrics] = useState<{[key: number]: boolean}>({});
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    if (data.sections) {
      setLyrics(data.sections.map(s => s.lyrics || ''));
      setDirectives(data.sections.map(s => s.sunoDirective.replace(/[()]/g, '')));
    }
  }, [data]);

  useEffect(() => {
      let basePrompt = data.sunoPrompt || "";
      const bpm = Math.round(data.bpm);
      const key = data.key;
      const metaParts = [];
      if (bpm > 0) metaParts.push(`${bpm} BPM`);
      if (key && key !== "Unknown") metaParts.push(`Key of ${key}`);
      const prefix = metaParts.join(", ");
      if (prefix && !basePrompt.startsWith(prefix.split(',')[0])) {
           setStylePrompt(`${prefix}, ${basePrompt}`);
      } else {
           setStylePrompt(basePrompt);
      }
  }, [data.sunoPrompt, data.bpm, data.key]);

  const handleLyricChange = (index: number, value: string) => {
    const newLyrics = [...lyrics];
    newLyrics[index] = value;
    setLyrics(newLyrics);
  };

  const handleDirectiveChange = (index: number, value: string) => {
    const newDirectives = [...directives];
    newDirectives[index] = value;
    setDirectives(newDirectives);
  };

  const handleQuickInsert = (index: number, command: string) => {
    if (!command) return;
    const current = directives[index] || "";
    const newValue = current ? `${current}, ${command}` : command;
    handleDirectiveChange(index, newValue);
  };

  const handleGenerateLyrics = async (index: number) => {
      setLoadingLyrics(prev => ({...prev, [index]: true}));
      const section = data.sections[index];
      try {
          const genLyrics = await generateSectionLyrics(
              data.genre,
              data.mood,
              section.name,
              section.description
          );
          if (genLyrics) {
              handleLyricChange(index, genLyrics);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingLyrics(prev => ({...prev, [index]: false}));
      }
  };

  const generateStructureBlock = () => {
    if (!data.sections) return "";
    const metaHeader = `[Info]
[Title: ${data.trackInfo?.title || "Untitled Project"}]
[BPM: ${Math.round(data.bpm)}]
[Key: ${data.key}]
[Genre: ${data.genre}]
`;
    const body = data.sections.map((section, index) => {
      const sectionName = section.name.replace(/[\[\]]/g, '').trim();
      let rawDirective = directives[index] || section.sunoDirective;
      const cleanDirective = rawDirective.replace(/[()]/g, '').trim();
      const sectionHeader = cleanDirective 
        ? `[${sectionName}, ${cleanDirective}]` 
        : `[${sectionName}]`;
      const lyric = lyrics[index] || "";
      return `${sectionHeader}\n${lyric ? lyric + '\n' : ''}`;
    }).join('\n');
    return `${metaHeader}\n${body}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [id]: true }));
    setTimeout(() => { setCopyStatus(prev => ({ ...prev, [id]: false })); }, 2000);
  };

  const renderCopyButton = (text: string, id: string, label: string) => {
      const isCopied = copyStatus[id];
      return (
        <button 
            onClick={() => copyToClipboard(text, id)}
            className={`text-[10px] font-bold uppercase px-3 py-1 md:px-4 md:py-1.5 rounded transition-all duration-300 flex items-center gap-2 border ${isCopied ? "bg-lime-500 border-lime-500 text-black" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}
        >
            {isCopied ? "已复制" : label}
        </button>
      );
  };

  return (
    <div className="w-full animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 sticky top-20 z-30 rounded-none w-full shadow-2xl gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 group">
                      <div className="p-1.5 rounded-full bg-white/5 border border-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></div>
                      <span className="text-sm font-bold uppercase">返回</span>
                  </button>
                  <h2 className="text-lg md:text-xl font-display font-bold text-white">复刻构筑台</h2>
              </div>
              
              {/* Mobile View Toggle */}
              <div className="flex lg:hidden bg-white/10 rounded-lg p-1">
                  <button onClick={() => setMobileTab('editor')} className={`px-3 py-1 text-xs font-bold rounded ${mobileTab === 'editor' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>编辑</button>
                  <button onClick={() => setMobileTab('preview')} className={`px-3 py-1 text-xs font-bold rounded ${mobileTab === 'preview' ? 'bg-lime-500 text-black' : 'text-slate-400'}`}>预览</button>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">BPM</span>
                  <span className="text-sm font-bold text-lime-400">{Math.round(data.bpm)}</span>
              </div>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
               <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">KEY</span>
                  <span className="text-sm font-bold text-cyan-400">{data.key}</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 min-h-[70vh]">
        
        {/* LEFT: IDE EDITOR (Visible on 'editor' tab or Desktop) */}
        <div className={`flex-col bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative ${mobileTab === 'editor' ? 'flex' : 'hidden'} lg:flex`}>
            <div className="bg-[#1a1a1a] px-4 py-3 border-b border-black flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500"></span>structure_editor.json</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {data.sections.map((section, index) => (
                    <div key={index} className="relative pl-4 border-l-2 border-white/5 hover:border-cyan-500/50 transition-colors">
                        <span className="absolute left-[-11px] top-0 text-[10px] text-slate-700 font-mono">{String(index + 1).padStart(2, '0')}</span>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-purple-400 font-mono text-sm font-bold">[{section.name}]</span>
                        </div>
                        <div className="mb-3">
                            <div className="flex justify-between items-end mb-1.5">
                                <label className="block text-[10px] text-slate-500 uppercase font-bold">风格指令</label>
                                <select 
                                    className="bg-black/50 border border-white/10 text-[10px] text-cyan-400 rounded px-2 py-1 outline-none"
                                    onChange={(e) => handleQuickInsert(index, e.target.value)}
                                    value=""
                                >
                                    {QUICK_COMMANDS.map(cmd => <option key={cmd.label} value={cmd.value}>{cmd.label}</option>)}
                                </select>
                            </div>
                            <input 
                                type="text" 
                                value={directives[index] || ""}
                                onChange={(e) => handleDirectiveChange(index, e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 text-yellow-400 font-mono text-xs p-3 rounded outline-none focus:border-yellow-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-[10px] text-slate-500 uppercase font-bold">歌词</label>
                                <button onClick={() => handleGenerateLyrics(index)} disabled={loadingLyrics[index]} className="text-[10px] px-2 py-1 rounded bg-cyan-900/20 text-cyan-400 border border-cyan-500/20">
                                    {loadingLyrics[index] ? '生成中...' : 'AI 灵感生成'}
                                </button>
                            </div>
                            <textarea
                                value={lyrics[index] || ""}
                                onChange={(e) => handleLyricChange(index, e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-white/5 text-slate-300 font-mono text-xs p-3 rounded outline-none focus:border-cyan-500 min-h-[80px]"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT: PREVIEW (Visible on 'preview' tab or Desktop) */}
        <div className={`flex-col gap-6 ${mobileTab === 'preview' ? 'flex' : 'hidden'} lg:flex`}>
            {/* Style Prompt */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-[#1a1a1a] px-4 py-3 border-b border-black flex justify-between items-center">
                    <span className="text-xs font-mono text-slate-200 font-bold">style_prompt.txt</span>
                    {renderCopyButton(stylePrompt, 'btn-style', '复制 Style')}
                </div>
                <div className="p-4 flex-1">
                    <textarea value={stylePrompt} onChange={(e) => setStylePrompt(e.target.value)} className="w-full h-full min-h-[100px] bg-transparent text-pink-300 font-mono text-xs resize-none outline-none"/>
                </div>
            </div>
            {/* Code */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col h-full min-h-[400px]">
                <div className="bg-[#1a1a1a] px-4 py-3 border-b border-black flex justify-between items-center">
                    <span className="text-xs font-mono text-slate-200 font-bold">final_output.suno</span>
                    {renderCopyButton(generateStructureBlock(), 'btn-struct', '复制全曲')}
                </div>
                <div className="p-4 flex-1 bg-[#050505] overflow-hidden">
                    <textarea readOnly value={generateStructureBlock()} className="w-full h-full bg-transparent text-slate-300 font-mono text-xs resize-none outline-none"/>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
