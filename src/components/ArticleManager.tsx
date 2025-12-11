
// src/components/ArticleManager.tsx

import React, { useState, useRef } from 'react';
import { Article, GalleryTrack, Category } from '../types';
import { storageService } from '../services/storageService';
import { FileSelectorModal } from './Common';

interface ArticleManagerProps {
  articles: Article[];
  tracks: GalleryTrack[];
  categories: Category[];
  onUpdate: (articles: Article[]) => void;
}

const AESTHETIC_COVERS = [
    "https://images.unsplash.com/photo-1620641788421-7f1c91ade639?q=80&w=1000", 
    "https://images.unsplash.com/photo-1504333638930-c8787321eee0?q=80&w=1000", 
];
const getRandomCover = () => AESTHETIC_COVERS[Math.floor(Math.random() * AESTHETIC_COVERS.length)];

// Preview Component using simplified logic from ArticleView
const MarkdownPreview = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    return (
        <div className="font-serif text-slate-300 text-sm leading-relaxed max-w-full overflow-hidden">
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={index} className="h-4"></div>;
                if (line.startsWith('# ')) return <h2 key={index} className="text-2xl font-display font-bold text-white mt-6 mb-3">{line.replace('# ', '')}</h2>;
                if (line.startsWith('## ')) return <h3 key={index} className="text-lg font-bold text-cyan-400 mt-4 mb-2">{line.replace('## ', '')}</h3>;
                const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
                if (imgMatch) return <img key={index} src={imgMatch[2]} alt={imgMatch[1]} className="w-full rounded border border-white/10 my-4" />;
                // Basic Table (Simple rendering for preview)
                if (line.startsWith('|')) return <pre key={index} className="text-xs bg-black/50 p-2 rounded overflow-x-auto">{line}</pre>;
                return <p key={index} className="mb-2">{line}</p>;
            })}
        </div>
    );
}

export const ArticleManager: React.FC<ArticleManagerProps> = ({ articles, tracks, categories, onUpdate }) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [state, setState] = useState({
      title: '', subtitle: '', author: 'NEXUS Editor', content: '', trackId: '', cover: '', categoryId: '', isUploading: false
  });
  const [showFileSelector, setShowFileSelector] = useState<{show: boolean, type: 'cover' | 'content'}>({ show: false, type: 'cover' });

  const articleCoverRef = useRef<HTMLInputElement>(null);
  const contentImageRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const articleCats = categories.filter(c => c.type === 'article');
  const filteredArticles = filterCategory === 'All' ? articles : articles.filter(a => a.categoryId === filterCategory);

  const resetForm = () => {
      setState({ title: '', subtitle: '', author: 'NEXUS Editor', content: '', trackId: '', cover: '', categoryId: '', isUploading: false });
      setMode('create');
      setEditingId(null);
      setActiveTab('write');
  };

  const handleEdit = (article: Article) => {
      setState({
          title: article.title,
          subtitle: article.subtitle || '',
          author: article.author,
          content: article.content,
          trackId: article.trackId || '',
          cover: article.coverUrl,
          categoryId: article.categoryId || '',
          isUploading: false
      });
      setEditingId(article.id);
      setMode('edit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const insertAtCursor = (before: string, after: string = "") => {
      if (!contentTextareaRef.current) return;
      const textarea = contentTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = state.content;
      const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);
      
      setState(p => ({ ...p, content: newText }));
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + before.length, end + before.length);
      }, 0);
  };

  const insertTable = () => {
      const tableTemplate = `\n| 标题 1 | 标题 2 | 标题 3 |\n| :--- | :---: | ---: |\n| 内容 A | 内容 B | 内容 C |\n| 内容 D | 内容 E | 内容 F |\n`;
      insertAtCursor(tableTemplate);
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setState(p => ({ ...p, isUploading: true }));
      try {
          const url = await storageService.uploadFile(file);
          insertAtCursor(`\n![Image](${url})\n`);
      } catch (e) {
          alert("图片插入失败");
      } finally {
          setState(p => ({ ...p, isUploading: false }));
          if (contentImageRef.current) contentImageRef.current.value = '';
      }
  };

  const handleArticleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const url = await storageService.uploadFile(file);
          setState(p => ({ ...p, cover: url }));
      } catch (e) { alert("封面上传失败"); }
  };

  const handleDelete = (id: string) => {
      if (!confirm("确定删除此文章？")) return;
      const updated = articles.filter(a => a.id !== id);
      onUpdate(updated);
  };

  const handlePublish = async () => {
      if (!state.title || !state.content) return alert("标题和内容不能为空");
      setState(p => ({ ...p, isUploading: true }));
      try {
          let cover = state.cover;
          if (!cover || cover.trim() === '') {
              cover = getRandomCover();
          }

          const articleData: Article = {
              id: mode === 'edit' && editingId ? editingId : Date.now().toString(),
              title: state.title,
              subtitle: state.subtitle,
              author: state.author || "NEXUS Editor",
              content: state.content,
              coverUrl: cover,
              trackId: state.trackId,
              categoryId: state.categoryId,
              publishedAt: mode === 'edit' ? (articles.find(a => a.id === editingId)?.publishedAt || Date.now()) : Date.now()
          };
          
          if (mode === 'edit') {
              const updated = articles.map(a => a.id === editingId ? articleData : a);
              onUpdate(updated);
              alert("文章更新成功！");
          } else {
              onUpdate([articleData, ...articles]);
              alert("文章发布成功！" + (!state.cover ? " (已自动生成封面)" : ""));
          }
          resetForm();
      } catch (e) {
          alert("发布失败");
      } finally {
          setState(p => ({ ...p, isUploading: false }));
      }
  };

  return (
    <div className="w-full space-y-8">
        <FileSelectorModal 
            isOpen={showFileSelector.show} 
            onClose={() => setShowFileSelector({ show: false, type: 'cover' })} 
            filter="image"
            onSelect={(url) => {
                if (showFileSelector.type === 'cover') {
                    setState(p => ({ ...p, cover: url }));
                } else {
                    insertAtCursor(`\n![Image](${url})\n`);
                }
            }}
        />

        {/* --- HEADER --- */}
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
            <div>
                <h3 className="text-3xl font-display font-bold text-white mb-1">专栏文章管理</h3>
                <p className="text-xs text-slate-500 font-mono">Total Articles: {articles.length}</p>
            </div>
            {mode === 'edit' && (
              <button onClick={resetForm} className="px-4 py-2 bg-slate-700 text-white rounded-full text-xs font-bold hover:bg-slate-600">
                  取消编辑
              </button>
            )}
        </div>

        {/* --- EDITOR AREA (SPLIT LAYOUT) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: METADATA & SETTINGS */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">基本信息</h4>
                    
                    <input type="text" value={state.title} onChange={e => setState({...state, title: e.target.value})} placeholder="文章标题" className="w-full bg-black border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-bold"/>
                    <input type="text" value={state.subtitle} onChange={e => setState({...state, subtitle: e.target.value})} placeholder="副标题 / 摘要" className="w-full bg-black border border-white/10 p-3 rounded-xl text-slate-300 text-sm outline-none"/>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={state.author} onChange={e => setState({...state, author: e.target.value})} placeholder="作者" className="bg-black border border-white/10 p-3 rounded-xl outline-none text-white text-sm"/>
                        <select value={state.categoryId} onChange={e => setState({...state, categoryId: e.target.value})} className="bg-black border border-white/10 p-3 rounded-xl outline-none text-slate-300 text-sm">
                            <option value="">选择分类...</option>
                            {articleCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <select value={state.trackId} onChange={e => setState({...state, trackId: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-xl outline-none text-slate-300 text-sm">
                        <option value="">-- 关联伴读音乐 (可选) --</option>
                        {tracks.map(t => <option key={t.id} value={t.id}>{t.title} - {t.artist}</option>)}
                    </select>
                </div>

                <div className="bg-[#111] p-6 rounded-2xl border border-white/10 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">封面设置</h4>
                    <div className="w-full aspect-video bg-black/50 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-cyan-500 transition-all relative group overflow-hidden" onClick={() => articleCoverRef.current?.click()}>
                        {state.cover ? (
                            <img src={state.cover} className="w-full h-full object-cover" />
                        ) : <div className="text-center text-slate-600 text-xs">
                                <div>点击上传封面</div>
                                <div className="text-[9px] mt-1">(为空自动生成)</div>
                            </div>
                        }
                        <input type="file" ref={articleCoverRef} onChange={handleArticleCoverUpload} className="hidden" accept="image/*"/>
                    </div>
                    <button onClick={() => setShowFileSelector({ show: true, type: 'cover' })} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300">
                        从媒体库选择
                    </button>
                </div>

                <button onClick={handlePublish} disabled={state.isUploading} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl shadow-lg uppercase tracking-widest transition-all">
                    {state.isUploading ? '处理中...' : (mode === 'edit' ? '保存文章更新' : '发布文章')}
                </button>
            </div>

            {/* RIGHT: EDITOR / PREVIEW */}
            <div className="lg:col-span-8 flex flex-col h-[700px] bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-2 bg-[#1a1a1a] border-b border-white/10">
                    <div className="flex gap-1">
                        <button onClick={() => setActiveTab('write')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeTab === 'write' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>编辑 Write</button>
                        <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>预览 Preview</button>
                    </div>
                    
                    {activeTab === 'write' && (
                        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                            <button onClick={() => insertAtCursor('# ')} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="大标题">H1</button>
                            <button onClick={() => insertAtCursor('## ')} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="副标题">H2</button>
                            <button onClick={() => insertAtCursor('**', '**')} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white font-bold" title="加粗">B</button>
                            <button onClick={insertTable} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="插入表格">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm2 2v3h12V6H6zm0 5v8h3v-8H6zm5 0v8h3v-8h-3zm5 0v8h3v-8h-3z"/></svg>
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-2"></div>
                            <button onClick={() => contentImageRef.current?.click()} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-cyan-400" title="上传图片">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </button>
                            <input type="file" ref={contentImageRef} onChange={handleContentImageUpload} className="hidden" accept="image/*"/>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-black relative">
                    {activeTab === 'write' ? (
                        <textarea 
                            ref={contentTextareaRef}
                            value={state.content} 
                            onChange={e => setState({...state, content: e.target.value})} 
                            placeholder="# 在此开始撰写...\n支持 Markdown 语法" 
                            className="w-full h-full bg-black p-6 outline-none resize-none font-mono text-sm text-slate-300 leading-relaxed custom-scrollbar" 
                        />
                    ) : (
                        <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar bg-black">
                            <div className="prose prose-invert max-w-none">
                                <h1 className="text-3xl font-display font-black text-white mb-4">{state.title || "Untitled Article"}</h1>
                                {state.cover && <img src={state.cover} className="w-full h-64 object-cover rounded-xl mb-8" />}
                                <MarkdownPreview content={state.content} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- ARTICLE LIST --- */}
        <div className="space-y-4 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">文章列表</h3>
                {/* Category Filter */}
                <div className="flex gap-2 bg-[#111] p-1 rounded-lg">
                    <button onClick={() => setFilterCategory('All')} className={`px-3 py-1 text-xs rounded transition-colors ${filterCategory === 'All' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-500 hover:text-white'}`}>全部</button>
                    {articleCats.map(c => (
                        <button key={c.id} onClick={() => setFilterCategory(c.id)} className={`px-3 py-1 text-xs rounded transition-colors ${filterCategory === c.id ? 'bg-cyan-500 text-black font-bold' : 'text-slate-500 hover:text-white'}`}>
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map(a => (
                    <div key={a.id} className="flex flex-col bg-[#111] rounded-xl border border-white/5 overflow-hidden group hover:border-cyan-500/30 transition-all">
                        <div className="h-32 bg-slate-900 relative">
                            <img src={a.coverUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-mono">
                                {new Date(a.publishedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h4 className="font-bold text-sm text-white mb-1 line-clamp-2">{a.title}</h4>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">{a.subtitle || "暂无摘要"}</p>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <span className="text-[10px] text-slate-600 uppercase">{a.author}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(a)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="编辑">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-500 transition-colors" title="删除">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredArticles.length === 0 && <div className="col-span-full py-12 text-center text-slate-600">该分类下暂无文章</div>}
            </div>
        </div>
    </div>
  );
};
