
// src/components/MusicManager.tsx

import React, { useState, useRef, useEffect } from 'react';
import { GalleryTrack, Category } from '../types';
import { storageService } from '../services/storageService';
import { FileSelectorModal } from './Common';

interface MusicManagerProps {
  tracks: GalleryTrack[];
  categories: Category[]; // Added Prop
  onUpdate: (tracks: GalleryTrack[]) => void;
  onStopGlobalMusic?: () => void;
}

// Enhanced Fallback Covers (High Quality)
const AESTHETIC_COVERS = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop"
];
const getRandomCover = () => AESTHETIC_COVERS[Math.floor(Math.random() * AESTHETIC_COVERS.length)];

// --- HEALTH CHECK COMPONENT ---
const HealthStatus = ({ src, sourceType }: { src: string, sourceType: string }) => {
    const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');

    useEffect(() => {
        if (!src) { setStatus('error'); return; }
        
        let url = src;
        if (sourceType === 'netease') url = `https://music.163.com/song/media/outer/url?id=${src}.mp3`;
        
        const audio = new Audio();
        if (sourceType !== 'netease' && sourceType !== 'qq') {
            audio.crossOrigin = "anonymous";
        }
        
        audio.src = url;
        audio.volume = 0;

        const handleSuccess = () => { setStatus('ok'); cleanup(); };
        const handleError = () => { setStatus('error'); cleanup(); };
        
        const cleanup = () => {
            audio.removeEventListener('canplay', handleSuccess);
            audio.removeEventListener('error', handleError);
            audio.pause();
            audio.src = "";
        };

        audio.addEventListener('canplay', handleSuccess);
        audio.addEventListener('error', handleError);
        
        const timeout = setTimeout(() => {
            if (status === 'checking') {
                setStatus('error'); 
                cleanup();
            }
        }, 5000);

        return () => { clearTimeout(timeout); cleanup(); };
    }, [src, sourceType]);

    if (status === 'checking') return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="检测中..."></div>;
    if (status === 'ok') return <div className="w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_8px_#84cc16]" title="连接正常"></div>;
    return <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" title="无法播放/链接失效"></div>;
};

export const MusicManager: React.FC<MusicManagerProps> = ({ tracks, categories, onUpdate, onStopGlobalMusic }) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');

  const [state, setState] = useState({
      title: '', artist: '', cover: '', sourceType: 'local' as GalleryTrack['sourceType'],
      inputValue: '', lyrics: '', audioFile: null as File | null, isHero: false, categoryId: '', isUploading: false
  });
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [r2Status, setR2Status] = useState<{ok: boolean, message: string} | null>(null);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [auditionId, setAuditionId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const musicCats = categories.filter(c => c.type === 'music');
  const filteredTracks = filterCategory === 'All' ? tracks : tracks.filter(t => t.categoryId === filterCategory);

  useEffect(() => {
      storageService.checkR2Status().then(setR2Status);
  }, []);

  // Handle preview start
  const handleAudition = (id: string | null) => {
      if (id && onStopGlobalMusic) {
          onStopGlobalMusic(); // Stop global playback
      }
      setAuditionId(id === auditionId ? null : id);
  };

  const resetForm = () => {
      setState({ title: '', artist: '', cover: '', sourceType: 'local', inputValue: '', lyrics: '', audioFile: null, isHero: false, categoryId: '', isUploading: false });
      setMode('create');
      setEditingId(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (track: GalleryTrack) => {
      setState({
          title: track.title,
          artist: track.artist,
          cover: track.coverUrl,
          sourceType: track.sourceType,
          inputValue: track.sourceType === 'local' ? '' : track.src,
          lyrics: track.lyrics || '',
          audioFile: null,
          isHero: !!track.isHero,
          categoryId: track.categoryId || '',
          isUploading: false
      });
      setEditingId(track.id);
      setMode('edit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
      if (!confirm("确定删除此曲目？")) return;
      const updated = tracks.filter(t => t.id !== id);
      onUpdate(updated);
  };

  const handleTrackPublish = async () => {
      if (!state.title || !state.artist) return alert("信息不完整");
      setState(p => ({ ...p, isUploading: true }));
      setUploadProgress(0);

      try {
          let finalSrc = state.inputValue;
          
          if (state.sourceType === 'local') {
              if (state.audioFile) {
                  finalSrc = await storageService.uploadFile(
                      state.audioFile,
                      (pct) => setUploadProgress(pct)
                  );
              } else if (mode === 'create' && !state.inputValue) {
                  throw new Error("请选择音频文件 (上传或从库中选择)");
              } else {
                   if (mode === 'edit' && !state.inputValue) {
                       finalSrc = tracks.find(t => t.id === editingId)?.src || '';
                   }
              }
          } else if (state.sourceType === 'netease') {
              const match = state.inputValue.match(/id=(\d+)/) || state.inputValue.match(/\/song\/(\d+)/);
              if (match) finalSrc = match[1];
              else if (/^\d+$/.test(state.inputValue)) finalSrc = state.inputValue;
              else if (mode === 'create') throw new Error("无效的网易云音乐 ID");
          }

          let cover = state.cover;
          if (!cover || cover.trim() === '') {
              cover = getRandomCover();
          }
          
          const trackData: GalleryTrack = {
              id: mode === 'edit' && editingId ? editingId : Date.now().toString(),
              title: state.title,
              artist: state.artist,
              coverUrl: cover,
              sourceType: state.sourceType,
              src: finalSrc,
              addedAt: mode === 'edit' ? (tracks.find(t => t.id === editingId)?.addedAt || Date.now()) : Date.now(),
              lyrics: state.lyrics,
              isHero: state.isHero,
              categoryId: state.categoryId
          };

          if (mode === 'edit') {
              const updatedTracks = tracks.map(t => t.id === editingId ? trackData : t);
              onUpdate(updatedTracks);
              alert("更新成功");
          } else {
              onUpdate([trackData, ...tracks]);
              alert("发布成功" + (!state.cover ? " (已自动生成封面)" : ""));
          }
          resetForm();
      } catch (e: any) { alert(e.message); } 
      finally { setState(p => ({ ...p, isUploading: false })); setUploadProgress(0); }
  };

  const getAudioSrc = (track: GalleryTrack) => {
      if (track.sourceType === 'netease') return `https://music.163.com/song/media/outer/url?id=${track.src}.mp3`;
      return track.src;
  }

  const formatPathDisplay = (path: string) => {
      if (!path) return '';
      if (path.startsWith('/api/file/')) return '云端资源 (R2 Direct Link)';
      return path;
  };
  
  const auditionTrack = tracks.find(t => t.id === auditionId);
  const isCorsRestricted = auditionTrack?.sourceType === 'netease' || auditionTrack?.sourceType === 'qq';

  return (
    <div className="w-full space-y-8">
        <FileSelectorModal 
            isOpen={showFileSelector} 
            onClose={() => setShowFileSelector(false)} 
            filter="audio"
            onSelect={(url) => setState(prev => ({...prev, inputValue: url, sourceType: 'local'}))}
        />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
            <div>
                <h3 className="text-3xl font-display font-bold text-white mb-1">音乐资源管理</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>总曲目: {tracks.length}</span>
                    <span className="text-white/20">|</span>
                    {r2Status && (
                        <span className={`flex items-center gap-1.5 ${r2Status.ok ? 'text-lime-500' : 'text-red-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r2Status.ok ? 'bg-lime-500' : 'bg-red-500'}`}></span>
                            存储桶状态: {r2Status.ok ? '在线' : r2Status.message}
                        </span>
                    )}
                </div>
            </div>
            {mode === 'edit' && (
                <button onClick={resetForm} className="px-6 py-2 bg-white/10 text-white rounded-full text-xs font-bold hover:bg-white/20 transition-colors uppercase tracking-widest">
                    取消编辑
                </button>
            )}
        </div>

        {/* Editor Form */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <svg className="w-64 h-64 text-lime-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Cover & Basic Info */}
                <div className="lg:col-span-4 space-y-6">
                     <div 
                        onClick={() => coverInputRef.current?.click()}
                        className="aspect-square bg-black/50 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-lime-500/50 hover:bg-lime-500/5 transition-all relative overflow-hidden group/cover"
                     >
                        {state.cover ? (
                            <img src={state.cover} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <div className="text-2xl mb-2 text-slate-600 group-hover/cover:text-lime-500 transition-colors">📷</div>
                                <div className="text-xs text-slate-500 font-bold uppercase">上传封面</div>
                                <div className="text-[9px] text-slate-600 mt-1">(为空自动生成)</div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">点击更换</span>
                        </div>
                        <input type="file" ref={coverInputRef} onChange={async (e) => {
                            if(e.target.files?.[0]) {
                                try {
                                    const url = await storageService.uploadFile(e.target.files[0]);
                                    setState(p => ({...p, cover: url}));
                                } catch(e){}
                            }
                        }} className="hidden"/>
                     </div>
                     
                     <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">音乐分类</label>
                         <select value={state.categoryId} onChange={e => setState({...state, categoryId: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-lime-500 text-xs">
                             <option value="">-- 选择分类 --</option>
                             {musicCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                     </div>

                     <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-lime-500/10 hover:border-lime-500/30 transition-all">
                        <input type="checkbox" checked={state.isHero} onChange={e => setState({...state, isHero: e.target.checked})} className="accent-lime-500 w-4 h-4"/>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">设为【音乐主页】轮播推荐</span>
                            <span className="text-[10px] text-slate-500">Music Landing Page Hero</span>
                        </div>
                    </label>
                </div>

                {/* Right: Metadata & Source */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">歌曲标题</label>
                            <input type="text" value={state.title} onChange={e => setState({...state, title: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white focus:border-lime-500 outline-none transition-colors font-bold text-lg" placeholder="输入歌曲名称" />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">艺术家</label>
                            <input type="text" value={state.artist} onChange={e => setState({...state, artist: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white focus:border-lime-500 outline-none transition-colors font-bold text-lg" placeholder="输入艺术家" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">音频来源配置</label>
                        <div className="flex gap-2 flex-wrap">
                            {['local','netease','qq','link'].map(t => (
                                <button key={t} onClick={() => setState({...state, sourceType: t as any})} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${state.sourceType === t ? 'bg-lime-500 text-black shadow-[0_0_15px_#84cc1666]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                                    {t === 'local' ? '本地上传' : t === 'link' ? '外部链接' : t === 'netease' ? '网易云音乐' : 'QQ音乐'}
                                </button>
                            ))}
                        </div>

                        {state.sourceType === 'local' ? (
                            <div className="p-6 bg-black/30 border border-white/10 rounded-xl flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-1 w-full">
                                    <div className="text-xs font-bold text-slate-300 mb-2">方式 A: 上传新文件</div>
                                    <input type="file" ref={fileInputRef} onChange={e => e.target.files && setState({...state, audioFile: e.target.files[0]})} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-lime-500/10 file:text-lime-500 hover:file:bg-lime-500/20"/>
                                </div>
                                <div className="hidden md:block w-px h-12 bg-white/10"></div>
                                <div className="flex-1 w-full">
                                    <div className="text-xs font-bold text-slate-300 mb-2">方式 B: 媒体库选择</div>
                                    <button onClick={() => setShowFileSelector(true)} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 border border-white/10">浏览云端文件...</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input type="text" placeholder={state.sourceType === 'netease' ? "输入网易云音乐 ID (例如: 1954302324)" : "输入链接..."} value={state.inputValue} onChange={e => setState({...state, inputValue: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white font-mono text-sm focus:border-lime-500 outline-none" />
                                {state.sourceType === 'netease' && <p className="text-[10px] text-slate-500">* 仅支持非 VIP 试听歌曲 ID</p>}
                            </div>
                        )}

                        {(state.inputValue || state.audioFile) && state.sourceType === 'local' && (
                             <div className="text-xs text-lime-400 font-mono flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse"></span>
                                 资源已就绪: {state.audioFile ? state.audioFile.name : formatPathDisplay(state.inputValue)}
                             </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LRC 歌词 (可选)</label>
                        <textarea 
                            value={state.lyrics} 
                            onChange={e => setState({...state, lyrics: e.target.value})} 
                            className="w-full h-24 bg-black/50 border border-white/10 p-4 rounded-xl text-slate-400 font-mono text-xs focus:border-lime-500 outline-none resize-none custom-scrollbar"
                            placeholder="[00:00.00] 粘贴歌词文本..."
                        />
                    </div>

                    <button 
                        onClick={handleTrackPublish} 
                        disabled={state.isUploading} 
                        className={`w-full py-4 font-bold rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg relative overflow-hidden ${state.isUploading ? 'bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-lime-500 hover:bg-lime-400 text-black shadow-lime-500/20'}`}
                    >
                        <span className="relative z-10">{state.isUploading ? `上传中 ${Math.round(uploadProgress)}%` : (mode === 'edit' ? '保存更改' : '发布单曲')}</span>
                        {state.isUploading && (
                            <div className="absolute top-0 left-0 h-full bg-lime-500/20 z-0 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 pb-2 border-b border-white/10 overflow-x-auto hide-scrollbar">
            <button onClick={() => setFilterCategory('All')} className={`px-4 py-1.5 text-xs rounded-full font-bold uppercase transition-all whitespace-nowrap ${filterCategory === 'All' ? 'bg-white text-black' : 'bg-white/5 text-slate-500 hover:text-white'}`}>全部 (All)</button>
            {musicCats.map(c => (
                <button key={c.id} onClick={() => setFilterCategory(c.id)} className={`px-4 py-1.5 text-xs rounded-full font-bold uppercase transition-all whitespace-nowrap ${filterCategory === c.id ? 'bg-white text-black' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                    {c.name}
                </button>
            ))}
        </div>

        {/* Track List - 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTracks.map(t => (
                <div key={t.id} className="group flex items-center gap-4 p-4 bg-[#111] rounded-xl border border-white/5 hover:border-lime-500/50 hover:bg-[#151515] transition-all hover:scale-[1.005]">
                    
                    {/* Status Dot */}
                    <div className="w-8 flex justify-center">
                        <HealthStatus src={t.src} sourceType={t.sourceType} />
                    </div>

                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10">
                        <img src={t.coverUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={() => handleAudition(t.id)} 
                                className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform"
                             >
                                 {auditionId === t.id ? '⏸' : '▶'}
                             </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white text-base truncate">{t.title}</h4>
                            {t.isHero && <span className="px-1.5 py-0.5 bg-lime-500 text-black text-[9px] font-black rounded uppercase">Hero</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{t.artist}</div>
                    </div>

                    {/* Compact View for Type/Actions */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-[10px] font-mono text-slate-600 uppercase bg-white/5 px-2 py-0.5 rounded">
                            {t.sourceType}
                        </div>
                        <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(t)} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors" title="编辑">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-slate-300 hover:text-red-500 transition-colors" title="删除">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {auditionId && auditionTrack && (
            <audio 
                ref={audioRef}
                src={getAudioSrc(auditionTrack)}
                autoPlay
                crossOrigin={isCorsRestricted ? undefined : "anonymous"}
                onEnded={() => setAuditionId(null)}
                onError={() => setAuditionId(null)}
                {...{ referrerPolicy: "no-referrer" } as any}
                className="hidden"
            />
        )}
    </div>
  );
};
