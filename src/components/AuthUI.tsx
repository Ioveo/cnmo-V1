
// src/components/AuthUI.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { UserProfileModal } from './UserProfile';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            setLoading(false);
        }
    }, [isOpen, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let res;
            if (mode === 'login') {
                res = await authService.login(email, password);
            } else {
                if (!username) throw new Error("请输入昵称");
                res = await authService.register(email, password, username);
            }
            onSuccess(res.user);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative shadow-[0_0_100px_rgba(204,255,0,0.1)] overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
                
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">✕</button>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tighter">
                        NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">ID</span>
                    </h2>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                        {mode === 'login' ? '用户登录' : '新用户注册'}
                    </p>
                </div>

                <div className="flex bg-white/5 rounded-full p-1 mb-8 relative z-10">
                    <button 
                        onClick={() => setMode('login')} 
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-full transition-all ${mode === 'login' ? 'bg-lime-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        登录
                    </button>
                    <button 
                        onClick={() => setMode('register')} 
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-full transition-all ${mode === 'register' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        注册
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    {mode === 'register' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">昵称 (Username)</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                className="w-full bg-black/50 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                                placeholder="设置您的代号..."
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">电子邮箱 (Email)</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full bg-black/50 border border-white/10 focus:border-white/40 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                            placeholder="name@example.com"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">密码 (Password)</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full bg-black/50 border border-white/10 focus:border-white/40 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold">
                            {error}
                        </div>
                    )}

                    <button 
                        disabled={loading}
                        className={`w-full py-4 mt-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg ${mode === 'login' ? 'bg-lime-500 hover:bg-lime-400 text-black' : 'bg-cyan-500 hover:bg-cyan-400 text-black'} disabled:opacity-50`}
                    >
                        {loading ? '处理中...' : (mode === 'login' ? '进入系统' : '初始化账号')}
                    </button>
                    
                    {mode === 'register' && (
                         <p className="text-[10px] text-slate-600 text-center pt-2">
                             * 严禁重复注册，每个邮箱仅限一个账号
                         </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export const UserMenu: React.FC<{ user: User | null, onOpenAuth: () => void, onLogout: () => void, onRefreshUser: (u: User) => void }> = ({ user, onOpenAuth, onLogout, onRefreshUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    if (!user) {
        return (
            <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group whitespace-nowrap"
            >
                <span className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-lime-500 transition-colors"></span>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase">登录</span>
            </button>
        );
    }

    return (
        <div className="relative">
            <UserProfileModal 
                isOpen={showProfile} 
                onClose={() => setShowProfile(false)} 
                user={user} 
                onUpdate={onRefreshUser} 
            />

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-full transition-all"
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-lime-500 to-cyan-500 flex items-center justify-center text-[10px] font-black text-black">
                    {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start leading-none">
                    <span className="text-[10px] font-bold text-white max-w-[80px] truncate">{user.username}</span>
                    <span className="text-[9px] font-mono text-lime-500">{user.credits} 点</span>
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-4 z-[90] animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-500 to-cyan-500 flex items-center justify-center text-sm font-black text-black">
                                {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{user.username}</h4>
                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">AI 额度</span>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-display font-bold text-lime-400">{user.credits}</span>
                                    <span className="text-[10px] text-slate-400 mb-1">剩余点数</span>
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-lime-500" style={{ width: `${Math.min((user.credits / 5) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => { setShowProfile(true); setIsOpen(false); }} className="w-full py-2 mb-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                            个人资料设置
                        </button>

                        <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full py-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors">
                            退出登录
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
