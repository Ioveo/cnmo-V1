
// src/components/GalleryManager.tsx

import React, { useState, useRef } from 'react';
import { GalleryImage } from '../types';
import { storageService } from '../services/storageService';
import { FileSelectorModal } from './Common';

interface GalleryManagerProps {
  images: GalleryImage[];
  onUpdate: (images: GalleryImage[]) => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ images, onUpdate }) => {
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<'upload' | 'link' | 'library'>('upload');
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePublish = async () => {
    if (!title) return alert("请输入标题");
    
    setIsUploading(true);
    try {
      let finalUrl = '';

      if (sourceType === 'upload') {
          if (!file) throw new Error("请选择图片文件");
          finalUrl = await storageService.uploadFile(file);
      } else {
          if (!inputValue) throw new Error("请输入图片链接");
          finalUrl = inputValue;
      }

      const newImage: GalleryImage = {
        id: Date.now().toString(),
        url: finalUrl,
        title: title,
        uploadedAt: Date.now()
      };
      
      const updated = [newImage, ...images];
      onUpdate(updated);
      await storageService.saveGallery(updated);
      
      setTitle('');
      setFile(null);
      setInputValue('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert("发布成功");
    } catch (e: any) {
      alert("操作失败: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此图片？")) return;
    const updated = images.filter(i => i.id !== id);
    onUpdate(updated); 
    try { await storageService.saveGallery(updated); } catch (e) { console.error("Sync error", e); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <FileSelectorModal 
            isOpen={showFileSelector} 
            onClose={() => setShowFileSelector(false)} 
            filter="image"
            onSelect={(url) => {
                setInputValue(url);
                setSourceType('library');
            }}
      />

      <div className="border-b border-white/10 pb-6">
          <h3 className="text-3xl font-display font-bold text-white mb-1">视觉画廊管理</h3>
          <p className="text-xs text-slate-500 font-mono">资产总数: {images.length}</p>
      </div>
      
      {/* Upload Area */}
      <div className="bg-[#111] p-8 rounded-2xl border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <svg className="w-64 h-64 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">作品标题 / 描述</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="请输入..." 
                        className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setSourceType('upload')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${sourceType === 'upload' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>本地上传</button>
                    <button onClick={() => { setSourceType('library'); setShowFileSelector(true); }} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${sourceType === 'library' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>R2 媒体库</button>
                    <button onClick={() => setSourceType('link')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${sourceType === 'link' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>外部链接</button>
                </div>
            </div>

            <div className="flex flex-col justify-end space-y-4">
                 <div className="bg-black/30 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-h-[140px]">
                    {sourceType === 'upload' ? (
                        <div className="w-full text-center">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={e => e.target.files && setFile(e.target.files[0])} 
                                className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-500/10 file:text-purple-500 hover:file:bg-purple-500/20"
                                accept="image/*"
                            />
                        </div>
                    ) : (
                        <div className="w-full space-y-2">
                            <input 
                                type="text" 
                                value={inputValue} 
                                onChange={e => setInputValue(e.target.value)} 
                                placeholder={sourceType === 'library' ? "从媒体库选择..." : "https://example.com/image.jpg"}
                                className="w-full bg-transparent text-center text-white outline-none font-mono text-sm placeholder-slate-600"
                                readOnly={sourceType === 'library'}
                                onClick={() => sourceType === 'library' && setShowFileSelector(true)}
                            />
                            {sourceType === 'library' && <div className="text-[10px] text-center text-slate-500">点击输入框重新选择</div>}
                        </div>
                    )}
                </div>

                <button 
                    onClick={handlePublish} 
                    disabled={isUploading} 
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                >
                    {isUploading ? '正在上传...' : '发布到画廊'}
                </button>
            </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map(img => (
          <div key={img.id} className="group relative aspect-square bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all hover:scale-[1.02]">
            <img src={img.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
              <span className="text-xs text-white font-bold text-center line-clamp-2">{img.title}</span>
              <button onClick={() => handleDelete(img.id)} className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] uppercase rounded-full hover:bg-red-500 hover:text-white transition-all">
                删除
              </button>
            </div>
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded px-2 py-0.5 text-[9px] text-slate-300 font-mono">
                {new Date(img.uploadedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
