
// src/components/CategoryManager.tsx

import React, { useState } from 'react';
import { Category } from '../types';
import { storageService } from '../services/storageService';

interface CategoryManagerProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Category['type']>('video');

  const handleAdd = async () => {
    if (!name.trim()) return;
    
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      type: type
    };
    
    const updated = [...categories, newCat];
    onUpdate(updated);
    try {
        await storageService.saveCategories(updated);
        setName('');
        alert('分类添加成功');
    } catch (e) {
        alert('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("确定删除此分类标签？")) return;
    const updated = categories.filter(c => c.id !== id);
    onUpdate(updated);
    await storageService.saveCategories(updated);
  };

  const filteredCats = categories.filter(c => c.type === type);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="border-b border-white/10 pb-6">
        <h3 className="text-3xl font-display font-bold text-white mb-1">全站分类配置</h3>
        <p className="text-xs text-slate-500 font-mono">管理各个板块的筛选标签</p>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">新建分类名称</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="例如: 赛博朋克, 深度学习..." 
                className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
              />
          </div>
          <div className="w-full md:w-48 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">所属板块</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white outline-none focus:border-blue-500 appearance-none"
              >
                  <option value="video">影视 (Cinema)</option>
                  <option value="music">音乐 (Music)</option>
                  <option value="article">文章 (Editorial)</option>
                  <option value="gallery">画廊 (Gallery)</option>
              </select>
          </div>
          <button onClick={handleAdd} className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg uppercase tracking-widest text-sm">
              添加
          </button>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden min-h-[400px]">
          <div className="flex border-b border-white/10">
               {['video','music','article','gallery'].map(t => (
                   <button 
                    key={t}
                    onClick={() => setType(t as any)}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${type === t ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
                   >
                       {t === 'video' ? '影视' : t === 'music' ? '音乐' : t === 'article' ? '文章' : '画廊'}
                   </button>
               ))}
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCats.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-blue-500/50 transition-all">
                      <span className="text-sm text-slate-300 font-medium group-hover:text-white">{c.name}</span>
                      <button onClick={() => handleDelete(c.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                          ✕
                      </button>
                  </div>
              ))}
              {filteredCats.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-600 font-mono text-xs">
                      该板块暂无分类标签
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
