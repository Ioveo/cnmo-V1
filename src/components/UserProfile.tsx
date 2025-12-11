
// src/components/UserProfile.tsx
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdate: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        setMsg('');
        setIsError(false);
        try {
            const updatedUser = await authService.updateProfile(username, password || undefined);
            onUpdate(updatedUser);
            setMsg('个人资料更新成功！');
            setPassword(''); // clear password field
        } catch (e: any) {
            setIsError(true);
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
            <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                <h3 className="text-2xl font-display font-bold text-white mb-6">个人中心</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">邮箱 (不可更改)</label>
                        <input type="text" value={user.email} disabled className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-slate-400 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">昵称</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">新密码 (留空则不修改)</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none" />
                    </div>

                    {msg && (
                        <div className={`p-3 rounded-lg text-xs font-bold text-center ${isError ? 'bg-red-500/10 text-red-400' : 'bg-lime-500/10 text-lime-400'}`}>
                            {msg}
                        </div>
                    )}

                    <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 mt-4">
                        {loading ? '保存中...' : '保存更改'}
                    </button>
                </div>
            </div>
        </div>
    );
};
