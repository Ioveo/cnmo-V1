
// src/components/SiteSettingsManager.tsx

import React, { useState, useEffect } from 'react';
import { SiteConfig } from '../types';
import { storageService } from '../services/storageService';

interface SiteSettingsManagerProps {
    config: SiteConfig | null;
    onUpdate: (config: SiteConfig) => void;
}

export const SiteSettingsManager: React.FC<SiteSettingsManagerProps> = ({ config, onUpdate }) => {
    const [labels, setLabels] = useState(config?.navLabels || {
        home: '主控台',
        video: '影视中心',
        music: '精选音乐',
        article: '深度专栏',
        gallery: '视觉画廊',
        dashboard: '工坊'
    });

    useEffect(() => {
        if (config) setLabels(config.navLabels);
    }, [config]);

    const handleSave = async () => {
        const newConfig = { navLabels: labels };
        onUpdate(newConfig);
        try {
            await storageService.saveSiteConfig(newConfig);
            alert("配置已保存，导航栏将即时更新");
        } catch (e) {
            alert("保存失败");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-white/10 pb-6">
                <h3 className="text-3xl font-display font-bold text-white mb-1">站点配置</h3>
                <p className="text-xs text-slate-500 font-mono">自定义网站导航名称与全局设置</p>
            </div>

            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-2">首页导航栏命名 (Navbar)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">主页 (Home)</label>
                        <input type="text" value={labels.home} onChange={e => setLabels({...labels, home: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-acid" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">影视 (Video)</label>
                        <input type="text" value={labels.video} onChange={e => setLabels({...labels, video: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-acid" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">音乐 (Music)</label>
                        <input type="text" value={labels.music} onChange={e => setLabels({...labels, music: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-acid" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">文章 (Article)</label>
                        <input type="text" value={labels.article} onChange={e => setLabels({...labels, article: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-acid" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">画廊 (Gallery)</label>
                        <input type="text" value={labels.gallery} onChange={e => setLabels({...labels, gallery: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-acid" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">工坊 (Studio)</label>
                        <input type="text" value={labels.dashboard} onChange={e => setLabels({...labels, dashboard: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-acid" />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <button onClick={handleSave} className="px-8 py-3 bg-acid hover:bg-white text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg">
                        保存配置
                    </button>
                </div>
            </div>
        </div>
    );
};
