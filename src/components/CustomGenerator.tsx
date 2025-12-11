
import React, { useState, useEffect } from 'react';
import { CreativeGeneratorRequest } from '../types';

interface CustomGeneratorProps {
  onGenerate: (request: CreativeGeneratorRequest) => void;
  isLoading: boolean;
  initialTags?: string[];
}

const SUNO_V5_TAGS = [
  "High Fidelity", "Crystalline Vocals", "8D Audio", "Wide Stereo", "Atmospheric", 
  "Cinematic", "Immersive", "Clean Mix", "Masterpiece",
  "Cyberpunk", "Synthwave", "Darkwave", "Ethereal", "Dreamy", 
  "Aggressive", "Melancholic", "Uplifting", "Euphoric", "Gritty",
  "Heavy Bass", "Analog Synths", "Orchestral", "Acoustic Guitar", "Distorted 808s"
];

const STRUCTURE_TEMPLATES = [
  { id: 'pop', label: '流行标准 (Pop)', desc: 'Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro' },
  { id: 'edm', label: '电子推进 (EDM)', desc: 'Intro-Build-Drop-Breakdown-Build-Drop-Outro' },
  { id: 'cinematic', label: '电影叙事 (Cinematic)', desc: 'Atmosphere-Theme A-Theme B-Climax-Resolution' },
  { id: 'random', label: 'AI 自由发挥 (Random)', desc: '由 AI 决定' },
];

export const CustomGenerator: React.FC<CustomGeneratorProps> = ({ onGenerate, isLoading, initialTags = [] }) => {
  const [concept, setConcept] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [template, setTemplate] = useState<string>('random');

  useEffect(() => {
    if (initialTags && initialTags.length > 0) {
      setSelectedTags(prev => [...new Set([...prev, ...initialTags])].slice(0, 10));
    }
  }, [initialTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 10) return;
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (!concept.trim()) return;
    onGenerate({ concept, selectedTags, structureTemplate: template as any });
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 animate-fade-in px-4">
      <div className="text-center mb-8 md:mb-12 space-y-2">
        <h2 className="text-3xl md:text-6xl font-display font-bold text-white tracking-tighter">
          创意 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">实验室</span>
        </h2>
        <p className="text-slate-400 font-light text-sm md:text-lg">
          [ CREATIVE_LAB ] :: V5 概念转化引擎
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* LEFT */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
             <label className="block text-xs font-mono text-pink-400 uppercase tracking-widest mb-3">01. 核心概念</label>
             <textarea 
               value={concept}
               onChange={(e) => setConcept(e.target.value)}
               placeholder="描述画面、故事或氛围..."
               className="w-full h-32 md:h-40 bg-black/40 border border-white/5 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all resize-none text-sm md:text-lg"
             />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
             <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-mono text-purple-400 uppercase tracking-widest">02. 风格矩阵</label>
                <span className="text-xs text-slate-500 font-mono">{selectedTags.length}/10</span>
             </div>
             <div className="flex flex-wrap gap-2">
               {selectedTags.filter(t => !SUNO_V5_TAGS.includes(t)).map(tag => (
                   <button key={tag} onClick={() => toggleTag(tag)} className="px-2 py-1 rounded text-xs border bg-pink-500/20 text-pink-200 border-pink-400/50">{tag}</button>
               ))}
               {SUNO_V5_TAGS.map(tag => (
                 <button key={tag} onClick={() => toggleTag(tag)} className={`px-2 py-1 rounded text-xs border transition-all ${selectedTags.includes(tag) ? 'bg-purple-500 text-white border-purple-400' : 'bg-black/40 text-slate-400 border-white/5'}`}>{tag}</button>
               ))}
             </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
             <label className="block text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">03. 结构蓝图</label>
             <div className="space-y-3">
               {STRUCTURE_TEMPLATES.map(tmpl => (
                 <div key={tmpl.id} onClick={() => setTemplate(tmpl.id)} className={`p-3 rounded-xl border cursor-pointer ${template === tmpl.id ? 'bg-cyan-900/20 border-cyan-500' : 'bg-black/20 border-white/5'}`}>
                   <div className="flex items-center justify-between mb-1">
                     <span className={`font-bold text-sm ${template === tmpl.id ? 'text-cyan-400' : 'text-slate-300'}`}>{tmpl.label}</span>
                     {template === tmpl.id && <div className="w-2 h-2 rounded-full bg-cyan-400"></div>}
                   </div>
                   <p className="text-[10px] text-slate-500 font-mono truncate">{tmpl.desc}</p>
                 </div>
               ))}
             </div>
          </div>

          <button onClick={handleSubmit} disabled={isLoading || !concept.trim()} className={`w-full py-4 md:py-6 rounded-2xl font-display text-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${isLoading || !concept.trim() ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl'}`}>
            {isLoading ? '正在构筑...' : '生成代码'}
          </button>
        </div>
      </div>
    </div>
  );
};