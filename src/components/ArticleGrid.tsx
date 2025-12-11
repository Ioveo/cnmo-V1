
// src/components/ArticleGrid.tsx

import React, { useState } from 'react';
import { Article } from '../types';

interface ArticleGridProps {
  articles: Article[];
  onRead: (article: Article) => void;
  isHomeView?: boolean;
}

// --- SUB-COMPONENTS ---

const CategoryTabs = ({ active, onChange }: { active: string, onChange: (c: string) => void }) => (
    <div className="flex items-center gap-1 mb-8 overflow-x-auto hide-scrollbar">
        {['最新发布', '深度观察', '科技前沿', '流行文化'].map(cat => (
            <button 
                key={cat}
                onClick={() => onChange(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${active === cat ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-transparent text-slate-500 border-white/10 hover:border-cyan-500 hover:text-cyan-500'}`}
            >
                {cat}
            </button>
        ))}
    </div>
);

// 1. MAGAZINE HERO (Featured)
const MagazineHero = ({ article, onRead }: { article: Article, onRead: (a: Article) => void }) => (
    <div 
        onClick={() => onRead(article)}
        className="group cursor-pointer relative h-[400px] md:h-[600px] w-full rounded-3xl overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-all duration-500"
    >
        <img src={article.coverUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col justify-end">
            <div className="flex items-center gap-3 mb-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-500">
                <span className="px-2 py-1 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest rounded">Featured</span>
                <span className="text-white text-[10px] font-mono uppercase">{new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
            <h2 className="text-3xl md:text-6xl font-display font-black text-white leading-[0.9] tracking-tighter mb-4 group-hover:text-cyan-400 transition-colors">
                {article.title}
            </h2>
            <p className="text-slate-300 text-sm md:text-xl line-clamp-2 max-w-2xl font-light border-l-4 border-cyan-500 pl-4">
                {article.subtitle || article.content.substring(0, 100)}...
            </p>
        </div>
    </div>
);

// 2. TRENDING SIDEBAR LIST
const TrendingSidebar = ({ articles, onRead }: { articles: Article[], onRead: (a: Article) => void }) => (
    <div className="flex flex-col h-full bg-[#111] border border-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">即时热讯</span>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 max-h-[400px] md:max-h-none">
            {articles.map((article, idx) => (
                <div key={article.id} onClick={() => onRead(article)} className="group cursor-pointer">
                    <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-2xl font-display font-black text-white/20 group-hover:text-cyan-500 transition-colors">{(idx + 1).toString().padStart(2, '0')}</span>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
                            {article.title}
                        </h4>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pl-8 uppercase tracking-wider">
                        {article.author} • {new Date(article.publishedAt).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
        <button className="mt-6 w-full py-3 bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors">
            查看归档
        </button>
    </div>
);

// 3. BENTO GRID (Standard Articles)
const BentoGrid = ({ articles, onRead }: { articles: Article[], onRead: (a: Article) => void }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map(article => (
            <div 
                key={article.id} 
                onClick={() => onRead(article)}
                className="group cursor-pointer bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:-translate-y-1"
            >
                <div className="h-48 overflow-hidden relative">
                    <img src={article.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-2 py-1 rounded text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                        Read
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[8px] font-bold text-white">
                            {article.author.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{article.author}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors leading-tight">
                        {article.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {article.subtitle || article.content.substring(0, 100)}...
                    </p>
                </div>
            </div>
        ))}
    </div>
);

// --- MAIN EDITORIAL HUB ---

export const EditorialHub = React.memo(({ articles, onRead, isHomeView = false }: ArticleGridProps) => {
    const [activeTab, setActiveTab] = useState('最新发布');

    if (!articles || articles.length === 0) return (
        <div className="py-20 text-center text-slate-500">Editorial Content Loading...</div>
    );

    // Filter Logic (Simulated)
    const featured = articles[0];
    const trending = articles.slice(1, 6);
    const standard = articles.slice(6);

    if (isHomeView) {
        // Simplified view for Home Page
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                <div className="lg:col-span-8">
                    <MagazineHero article={featured} onRead={onRead} />
                </div>
                <div className="lg:col-span-4 h-full">
                    <TrendingSidebar articles={trending} onRead={onRead} />
                </div>
            </div>
        );
    }

    // Full Page View
    return (
        <div className="w-full space-y-12 pb-24">
            
            {/* Top Section: Hero + Trending */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <MagazineHero article={featured} onRead={onRead} />
                </div>
                <div className="lg:col-span-4">
                    <TrendingSidebar articles={trending} onRead={onRead} />
                </div>
            </div>

            {/* Bottom Section: Tabs + Grid */}
            <div>
                <CategoryTabs active={activeTab} onChange={setActiveTab} />
                <BentoGrid articles={standard} onRead={onRead} />
            </div>
        </div>
    );
});
