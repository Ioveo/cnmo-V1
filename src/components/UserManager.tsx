
// src/components/UserManager.tsx

import React, { useState, useEffect } from 'react';
import { User } from '../types';

export const UserManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users', {
                headers: { 'x-admin-password': localStorage.getItem('admin_password') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRecharge = async (userId: string, amount: number) => {
        if(!confirm(`确定为该用户增加 ${amount} 点数?`)) return;
        try {
            const res = await fetch(`/api/users/${userId}/credits`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-password': localStorage.getItem('admin_password') || '' 
                },
                body: JSON.stringify({ amount })
            });
            if(res.ok) {
                alert("充值成功");
                loadUsers();
            }
        } catch(e) { alert("充值失败"); }
    };

    const handleDelete = async (userId: string) => {
        if(!confirm("确定删除此用户？此操作不可恢复。")) return;
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': localStorage.getItem('admin_password') || '' }
            });
            if(res.ok) {
                loadUsers();
            }
        } catch(e) { alert("删除失败"); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                <div>
                    <h3 className="text-3xl font-display font-bold text-white mb-1">用户管理</h3>
                    <p className="text-xs text-slate-500 font-mono">注册用户总数: {users.length}</p>
                </div>
                <button onClick={loadUsers} className="text-xs font-bold text-cyan-400 hover:text-white uppercase">刷新列表</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {users.map(u => (
                    <div key={u.id} className="bg-[#111] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white">
                                {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{u.username}</h4>
                                <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                                <p className="text-[10px] text-slate-600">注册于: {new Date(u.createdAt).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between">
                            <div className="text-center">
                                <span className="block text-[10px] text-slate-500 uppercase tracking-widest">Credits</span>
                                <span className={`text-xl font-bold ${u.credits > 0 ? 'text-lime-400' : 'text-red-400'}`}>{u.credits}</span>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleRecharge(u.id, 5)} className="px-3 py-1.5 rounded bg-lime-500/10 text-lime-400 text-xs font-bold hover:bg-lime-500 hover:text-black transition-colors">
                                    +5 充值
                                </button>
                                <button onClick={() => handleDelete(u.id)} className="px-3 py-1.5 rounded bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
                                    删除
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {users.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">暂无注册用户</div>
                )}
            </div>
        </div>
    );
};
