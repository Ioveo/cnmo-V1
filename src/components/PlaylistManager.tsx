
// src/components/PlaylistManager.tsx

import React, { useState, useRef } from 'react';
import { Playlist, GalleryTrack } from '../types';
import { storageService } from '../services/storageService';
import { FileSelectorModal } from './Common';

interface PlaylistManagerProps {
  playlists: Playlist[];
  tracks: GalleryTrack[];
  onUpdate: (playlists: Playlist[]) => void;
}

const AESTHETIC_COVERS = [
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=800&auto=format&fit=crop"
];
const getRandomCover = () => AESTHETIC_COVERS[Math.floor(Math.random() * AESTHETIC_COVERS.length)];

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({ playlists, tracks, onUpdate }) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [state, setState] = useState({
      title: '',
      description: '',
      cover: '',
      trackIds: [] as string[],
      isUploading: false
  });

  const [showFileSelector, setShowFileSelector] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
      setState({ title: '', description: '', cover: '', trackIds: [], isUploading: false });
      setMode('create');
      setEditingId(null);
  };

  const handleEdit = (playlist: Playlist) => {
      setState({
          title: playlist.title,
          description: playlist.description || '',
          cover: playlist.coverUrl,
          trackIds: playlist.trackIds || [],
          isUploading: false
      });
      setEditingId(playlist.id);
      setMode('edit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
      if (!confirm("确定删除此歌单？")) return;
      const updated = playlists.filter(p => p.id !== id);
      onUpdate(updated);
      storageService.savePlaylists(updated);
  };

  const handleSave = async () => {
      if (!state.title) return alert("请输入标题");
      setState(p => ({ ...p, isUploading: true }));

      try {
          let cover = state.cover;
          if (!cover) cover = getRandomCover();

          const playlistData: Playlist = {
              id: mode === 'edit' && editingId ? editingId : `pl_${Date.now()}`,
              title: state.title,
              description: state.description,
              coverUrl: cover,
              trackIds: state.trackIds,
              addedAt: mode === 'edit' ? (playlists.find(p => p.id === editingId)?.addedAt || Date.now()) : Date.now()
          };

          let updated = [...playlists];
          if (mode === 'edit') {
              updated = updated.map(p => p.id === editingId ? playlistData : p);
          } else {
              updated = [playlistData, ...updated];
          }

          onUpdate(updated);
          await storageService.savePlaylists(updated);
          alert("歌单保存成功");
          resetForm();
      } catch (e) {
          alert("保存失败");
      } finally {
          setState(p => ({ ...p, isUploading: false }));
      }
  };

  const toggleTrack = (trackId: string) => {
      if (state.trackIds.includes(trackId)) {
          setState(p => ({ ...p, trackIds: p.trackIds.filter(id => id !== trackId) }));
      } else {
          setState(p => ({ ...p, trackIds: [...p.trackIds, trackId] }));
      }
  };

  return (
    <div className="w-full space-y-8">
        <FileSelectorModal 
            isOpen={showFileSelector} 
            onClose={() => setShowFileSelector(false)} 
            filter="image"
            onSelect={(url) => setState(p => ({ ...p, cover: url }))}
        />

        <div className="flex justify-between items-center border-b border-white/10 pb-6">
            <div>
                <h3 className="text-3xl font-display font-bold text-white mb-1">精选歌单管理</h3>
                <p className="text-xs text-slate-500 font-mono">Total Playlists: {playlists.length}</p>
            </div>
            {mode === 'edit' && <button onClick={resetForm} className="px-6 py-2 bg-white/10 text-white rounded-full text-xs font-bold uppercase hover:bg-white/20">取消编辑</button>}
        </div>

        {/* Editor */}
        <div className="bg-[#111] p-8 rounded-2xl border border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Info */}
            <div className="lg:col-span-4 space-y-6">
                <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="aspect-square bg-black/50 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all relative overflow-hidden group"
                >
                    {state.cover ? <img src={state.cover} className="w-full h-full object-cover" /> : (
                        <div className="text-center p-4">
                            <span className="text-3xl text-slate-600 block mb-2">💿</span>
                            <span className="text-xs font-bold text-slate-500 uppercase">歌单封面</span>
                        </div>
                    )}
                    <input type="file" ref={coverInputRef} onChange={async (e) => {
                        if(e.target.files?.[0]) {
                            const url = await storageService.uploadFile(e.target.files[0]);
                            setState(p => ({...p, cover: url}));
                        }
                    }} className="hidden"/>
                </div>
                <button onClick={() => setShowFileSelector(true)} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300">从媒体库选择封面</button>

                <input type="text" value={state.title} onChange={e => setState({...state, title: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white font-bold outline-none focus:border-purple-500" placeholder="歌单标题" />
                <textarea value={state.description} onChange={e => setState({...state, description: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-slate-300 text-xs outline-none focus:border-purple-500 resize-none h-24" placeholder="歌单描述..." />
                
                <button onClick={handleSave} disabled={state.isUploading} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg uppercase tracking-widest transition-all">
                    {state.isUploading ? '保存中...' : (mode === 'edit' ? '更新歌单' : '创建歌单')}
                </button>
            </div>

            {/* Right: Track Selector */}
            <div className="lg:col-span-8 bg-black/30 border border-white/5 rounded-xl flex flex-col overflow-hidden h-[600px]">
                <div className="p-4 border-b border-white/10 bg-[#1a1a1a] flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase">选择包含的歌曲 ({state.trackIds.length})</span>
                    <button onClick={() => setState(p => ({...p, trackIds: []}))} className="text-[10px] text-slate-500 hover:text-white">清空选择</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {tracks.map(track => (
                        <div 
                            key={track.id} 
                            onClick={() => toggleTrack(track.id)}
                            className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${state.trackIds.includes(track.id) ? 'bg-purple-500/20 border-purple-500/50' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${state.trackIds.includes(track.id) ? 'bg-purple-500 border-purple-500' : 'border-slate-600'}`}>
                                {state.trackIds.includes(track.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <img src={track.coverUrl} className="w-8 h-8 rounded object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-white truncate">{track.title}</div>
                                <div className="text-xs text-slate-500">{track.artist}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Playlist List */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {playlists.map(pl => (
                <div key={pl.id} className="group relative bg-[#111] rounded-xl border border-white/5 overflow-hidden hover:border-purple-500/50 transition-all hover:-translate-y-1">
                    <div className="aspect-square bg-black relative">
                        <img src={pl.coverUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => handleEdit(pl)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/20">编辑</button>
                            <button onClick={() => handleDelete(pl.id)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500 text-white text-xs rounded border border-red-500/30">删除</button>
                        </div>
                    </div>
                    <div className="p-4">
                        <h4 className="font-bold text-white text-sm truncate mb-1">{pl.title}</h4>
                        <p className="text-xs text-slate-500">{pl.trackIds.length} 首歌曲</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
