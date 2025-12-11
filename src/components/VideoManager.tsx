
// src/components/VideoManager.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Video, Category } from '../types';
import { storageService } from '../services/storageService';
import { FileSelectorModal } from './Common';

interface VideoManagerProps {
  videos: Video[];
  categories: Category[];
  onUpdate: (videos: Video[]) => void;
}

const AESTHETIC_COVERS = [
    "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=1000",
    "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1000",
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000"
];
const getRandomCover = () => AESTHETIC_COVERS[Math.floor(Math.random() * AESTHETIC_COVERS.length)];

// Helper to generate a thumbnail from a video file
const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.muted = true;
        
        video.onloadedmetadata = () => {
            // Seek to 15% or 5 seconds, whichever is smaller, to get a non-black frame usually
            video.currentTime = Math.min(video.duration * 0.15, 5);
        };
        
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            } else {
                resolve('');
            }
            URL.revokeObjectURL(video.src);
        };

        video.onerror = () => {
            resolve('');
            URL.revokeObjectURL(video.src);
        };
    });
};

export const VideoManager: React.FC<VideoManagerProps> = ({ videos, categories, onUpdate }) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');

  const [state, setState] = useState({
      title: '', 
      author: '', 
      videoUrl: '', 
      audioUrl: '', // New separate audio track
      sourceType: 'local' as 'local' | 'external', 
      audioSourceType: 'local' as 'local' | 'external', // New: Audio specific source type
      categoryId: '', 
      cover: '', 
      description: '', 
      isHero: false,         
      isVideoPageHero: false,
      adSlogan: '', 
      isUploading: false
  });
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [r2Status, setR2Status] = useState<{ok: boolean, message: string} | null>(null);
  const [showFileSelector, setShowFileSelector] = useState<{show: boolean, type: 'video' | 'audio'}>({show: false, type: 'video'});
  
  const [videoFile, setVideoFile] = useState<File|null>(null);
  const [audioFile, setAudioFile] = useState<File|null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const videoCats = categories.filter(c => c.type === 'video');
  const filteredVideos = filterCategory === 'All' ? videos : videos.filter(v => v.categoryId === filterCategory);

  useEffect(() => {
      storageService.checkR2Status().then(setR2Status);
  }, []);

  const resetForm = () => {
      setState({ 
          title: '', author: '', videoUrl: '', audioUrl: '', sourceType: 'local', audioSourceType: 'local', categoryId: '', 
          cover: '', description: '', isHero: false, isVideoPageHero: false,
          adSlogan: '', isUploading: false 
      });
      setVideoFile(null);
      setAudioFile(null);
      setMode('create');
      setEditingId(null);
      setUploadProgress(0);
      if(videoInputRef.current) videoInputRef.current.value = '';
      if(audioInputRef.current) audioInputRef.current.value = '';
  };

  const handleEdit = (video: Video) => {
      setState({
          title: video.title,
          author: video.author,
          videoUrl: video.videoUrl,
          audioUrl: video.audioUrl || '',
          sourceType: video.sourceType,
          audioSourceType: video.audioUrl && !video.audioUrl.startsWith('/api/file') ? 'external' : 'local', // Guess type
          categoryId: video.categoryId || '',
          cover: video.coverUrl,
          description: video.description || '',
          isHero: !!video.isHero,
          isVideoPageHero: !!video.isVideoPageHero,
          adSlogan: video.adSlogan || '',
          isUploading: false
      });
      setEditingId(video.id);
      setMode('edit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const file = e.target.files[0];
          setVideoFile(file);
          // Auto generate thumbnail
          const thumb = await generateThumbnail(file);
          if (thumb) {
              setState(prev => ({ ...prev, cover: thumb }));
          }
      }
  };

  const handleSubmit = async () => {
      if (!state.title) return alert("请输入标题");
      setState(p => ({ ...p, isUploading: true }));
      setUploadProgress(0);

      try {
          // 1. Handle Video Upload
          let finalVideoUrl = state.videoUrl;
          if (state.sourceType === 'local') {
              if (videoFile) {
                  finalVideoUrl = await storageService.uploadFile(
                      videoFile, 
                      (pct) => setUploadProgress(pct * 0.5) // First 50%
                  );
              } else if (!state.videoUrl && mode === 'create') {
                  throw new Error("请选择视频文件");
              }
          } else {
              if (!state.videoUrl) throw new Error("请输入视频链接");
          }

          // 2. Handle Audio Upload (Optional)
          let finalAudioUrl = state.audioUrl;
          if (state.audioSourceType === 'local') {
              if (audioFile) {
                  finalAudioUrl = await storageService.uploadFile(
                      audioFile,
                      (pct) => setUploadProgress(50 + pct * 0.5) // Last 50%
                  );
              }
          } else {
              // External audio link
              finalAudioUrl = state.audioUrl;
          }

          // 3. Handle Cover
          let finalCover = state.cover;
          if (!finalCover) {
              finalCover = getRandomCover(); 
          } else if (finalCover.startsWith('data:image')) {
               const res = await fetch(finalCover);
               const blob = await res.blob();
               const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
               finalCover = await storageService.uploadFile(file);
          }

          const videoData: Video = {
              id: mode === 'edit' && editingId ? editingId : Date.now().toString(),
              title: state.title,
              author: state.author || "Unknown",
              coverUrl: finalCover,
              videoUrl: finalVideoUrl,
              audioUrl: finalAudioUrl, // Added
              sourceType: state.sourceType,
              category: videoCats.find(c => c.id === state.categoryId)?.name || 'General',
              categoryId: state.categoryId,
              addedAt: mode === 'edit' ? (videos.find(v => v.id === editingId)?.addedAt || Date.now()) : Date.now(),
              description: state.description,
              isHero: state.isHero,
              isVideoPageHero: state.isVideoPageHero,
              adSlogan: state.adSlogan
          };
          
          let updatedVideos = [...videos];
          
          if (mode === 'edit') {
              updatedVideos = updatedVideos.map(v => v.id === editingId ? videoData : v);
          } else {
              updatedVideos = [videoData, ...updatedVideos];
          }

          // Enforce Single Hero Logic
          if (videoData.isHero) {
              updatedVideos = updatedVideos.map(v => 
                  (v.id === videoData.id) ? v : { ...v, isHero: false }
              );
          }
          if (videoData.isVideoPageHero) {
              updatedVideos = updatedVideos.map(v => 
                  (v.id === videoData.id) ? v : { ...v, isVideoPageHero: false }
              );
          }

          onUpdate(updatedVideos);
          await storageService.saveVideos(updatedVideos);
          alert("保存成功");
          resetForm();
      } catch (e: any) {
          alert("操作失败: " + e.message);
      } finally {
          setState(p => ({ ...p, isUploading: false }));
          setUploadProgress(0);
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("确定删除此视频信息？")) return;
      const updated = videos.filter(v => v.id !== id);
      onUpdate(updated);
      try { await storageService.saveVideos(updated); } catch(e) { console.error(e); }
  };

  return (
    <div className="w-full space-y-8">
      <FileSelectorModal 
        isOpen={showFileSelector.show} 
        onClose={() => setShowFileSelector({ show: false, type: 'video' })} 
        filter={showFileSelector.type}
        onSelect={(url) => {
            if (showFileSelector.type === 'video') setState(prev => ({...prev, videoUrl: url, sourceType: 'local'}));
            if (showFileSelector.type === 'audio') setState(prev => ({...prev, audioUrl: url, audioSourceType: 'local' }));
        }}
      />

      <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
              <h3 className="text-3xl font-display font-bold text-white mb-1">影视库管理</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>总计: {videos.length}</span>
                  {r2Status && (
                      <span className={`flex items-center gap-1 ml-2 ${r2Status.ok ? 'text-lime-500' : 'text-red-500'}`}>
                          • 存储桶: {r2Status.ok ? '正常' : '异常'}
                      </span>
                  )}
              </div>
          </div>
          {mode === 'edit' && <button onClick={resetForm} className="px-6 py-2 bg-white/10 text-white rounded-full text-xs font-bold uppercase hover:bg-white/20">取消编辑</button>}
      </div>
      
      {/* Editor Form */}
      <div className="bg-[#111] p-8 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <svg className="w-64 h-64 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-5 space-y-6">
                   <div 
                        onClick={() => coverInputRef.current?.click()}
                        className="aspect-video bg-black/50 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all relative overflow-hidden group/cover"
                   >
                       {state.cover ? <img src={state.cover} className="w-full h-full object-cover" /> : (
                           <div className="text-center">
                               <span className="text-3xl text-slate-600 block mb-2">🎬</span>
                               <span className="text-xs font-bold text-slate-500 uppercase">上传视频封面</span>
                               <span className="text-[9px] text-slate-600 block mt-1">(或上传视频自动截取)</span>
                           </div>
                       )}
                       <input type="file" ref={coverInputRef} onChange={async (e) => {
                           if(e.target.files?.[0]) {
                               const url = await storageService.uploadFile(e.target.files[0]);
                               setState(p => ({...p, cover: url}));
                           }
                       }} className="hidden"/>
                   </div>

                   {/* DUAL HERO CONTROLS */}
                   <div className="grid grid-cols-1 gap-3">
                        <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${state.isHero ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                                <input type="checkbox" checked={state.isHero} onChange={e => setState({...state, isHero: e.target.checked})} className="accent-orange-500 w-4 h-4"/>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${state.isHero ? 'text-orange-400' : 'text-white'}`}>设为【全局首页】主推</span>
                                    <span className="text-[10px] text-slate-500">Global Landing Page Hero</span>
                                </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${state.isVideoPageHero ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                                <input type="checkbox" checked={state.isVideoPageHero} onChange={e => setState({...state, isVideoPageHero: e.target.checked})} className="accent-cyan-500 w-4 h-4"/>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${state.isVideoPageHero ? 'text-cyan-400' : 'text-white'}`}>设为【影视中心】主推</span>
                                    <span className="text-[10px] text-slate-500">Video Hub Page Hero</span>
                                </div>
                        </label>
                  </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">视频标题</label>
                          <input type="text" value={state.title} onChange={e => setState({...state, title: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:border-orange-500 outline-none" placeholder="输入标题" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">作者 / 导演</label>
                          <input type="text" value={state.author} onChange={e => setState({...state, author: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:border-orange-500 outline-none" placeholder="输入作者" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">分类</label>
                            <select value={state.categoryId} onChange={e => setState({...state, categoryId: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:border-orange-500 outline-none appearance-none">
                                <option value="">选择分类...</option>
                                {videoCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">广告语 (Slogan - 小标签)</label>
                            <input type="text" value={state.adSlogan} onChange={e => setState({...state, adSlogan: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-orange-300 focus:border-orange-500 outline-none placeholder-slate-700" placeholder="例如: 独家首映" />
                        </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">推荐语 / 剧情简介 (用于 Hero 大屏)</label>
                      <textarea 
                        value={state.description} 
                        onChange={e => setState({...state, description: e.target.value})} 
                        className="w-full h-24 bg-black/50 border border-white/10 p-3 rounded-xl text-slate-300 focus:border-orange-500 outline-none resize-none text-xs leading-relaxed" 
                        placeholder="输入在首页大图上显示的详细推荐文案..." 
                      />
                  </div>

                  {/* VIDEO SOURCE */}
                  <div className="space-y-4 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-white uppercase tracking-widest bg-orange-500 text-black px-2 py-0.5 rounded">视频源 (Visual)</label>
                          <div className="flex gap-2">
                              <button onClick={() => setState({...state, sourceType: 'local'})} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${state.sourceType === 'local' ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>本地</button>
                              <button onClick={() => setState({...state, sourceType: 'external'})} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${state.sourceType === 'external' ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>链接</button>
                          </div>
                      </div>

                      {state.sourceType === 'local' ? (
                        <div className="flex flex-col md:flex-row gap-4 items-center bg-black/30 p-4 rounded-xl border border-white/10">
                            <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoFileChange} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20"/>
                            <button onClick={() => setShowFileSelector({ show: true, type: 'video' })} className="w-full md:w-auto text-xs font-bold text-slate-300 hover:text-white whitespace-nowrap">从库选择</button>
                        </div>
                      ) : (
                          <input type="text" value={state.videoUrl} onChange={e => setState({...state, videoUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white font-mono text-xs focus:border-orange-500 outline-none" placeholder="https://..." />
                      )}
                  </div>

                  {/* AUDIO SOURCE (SEPARATE) */}
                  <div className="space-y-4 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-white uppercase tracking-widest bg-cyan-500 text-black px-2 py-0.5 rounded w-fit">音频伴奏 (Audio Track)</label>
                          <div className="flex gap-2">
                              <button onClick={() => setState({...state, audioSourceType: 'local'})} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${state.audioSourceType === 'local' ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>本地</button>
                              <button onClick={() => setState({...state, audioSourceType: 'external'})} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${state.audioSourceType === 'external' ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>链接</button>
                          </div>
                      </div>
                      <p className="text-[9px] text-slate-500 -mt-2">若上传，将替换视频原声。适用于“无声视频 + 高音质音频”的合成播放。</p>
                      
                      {state.audioSourceType === 'local' ? (
                          <div className="flex flex-col md:flex-row gap-4 items-center bg-black/30 p-4 rounded-xl border border-white/10">
                                <input 
                                    type="file" 
                                    ref={audioInputRef} 
                                    accept="audio/*" 
                                    onChange={e => e.target.files && setAudioFile(e.target.files[0])} 
                                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-cyan-500/10 file:text-cyan-500 hover:file:bg-cyan-500/20"
                                />
                                <div className="hidden md:block w-px h-8 bg-white/10"></div>
                                <button onClick={() => setShowFileSelector({ show: true, type: 'audio' })} className="w-full md:w-auto text-xs font-bold text-slate-300 hover:text-white whitespace-nowrap">从库选择</button>
                          </div>
                      ) : (
                          <input type="text" value={state.audioUrl} onChange={e => setState({...state, audioUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none" placeholder="输入音频链接 (支持长链接/Token/GoogleVideo...)" />
                      )}
                  </div>

                  <button onClick={handleSubmit} disabled={state.isUploading} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg relative overflow-hidden uppercase tracking-widest text-sm">
                      <span className="relative z-10">{state.isUploading ? `上传中...` : (mode === 'edit' ? '保存更改' : '发布视频')}</span>
                      {state.isUploading && <div className="absolute top-0 left-0 h-full bg-orange-800 z-0 transition-all" style={{ width: `${uploadProgress}%` }}></div>}
                  </button>
              </div>
          </div>
      </div>
      
      {/* List Code (Unchanged) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVideos.map(v => (
              <div key={v.id} className="flex items-center gap-4 p-4 bg-[#111] rounded-xl border border-white/5 hover:border-orange-500/50 transition-colors group">
                  <div className="relative w-24 h-14 shrink-0 rounded overflow-hidden">
                      <img src={v.coverUrl} className="w-full h-full object-cover" />
                      {/* STATUS BADGES */}
                      <div className="absolute top-0 right-0 flex flex-col items-end p-1 gap-1">
                        {v.isHero && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-lg" title="Global Hero"></div>}
                        {v.isVideoPageHero && <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg" title="Video Page Hero"></div>}
                        {v.audioUrl && <div className="w-2 h-2 rounded-full bg-lime-500 shadow-lg" title="Hybrid Audio"></div>}
                      </div>
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white truncate">{v.title}</h4>
                      </div>
                      <div className="text-xs text-slate-500">{v.category} • {v.author}</div>
                  </div>
                  <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(v)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded">编辑</button>
                      <button onClick={() => handleDelete(v.id)} className="px-3 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs rounded">删除</button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
