// src/components/UserManager.tsx

import React, { useState, useEffect } from 'react';
import { User } from '../types';

export const UserManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    
    // UI States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [rechargingUser, setRechargingUser] = useState<User | null>(null);
    
    // Form States
    const [editForm, setEditForm] = useState({ username: '', email: '', password: '' });
    const [rechargeAmount, setRechargeAmount] = useState(5);

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

    const openEdit = (u: User) => {
        setEditingUser(u);
        setEditForm({ username: u.username, email: u.email, password: '' });
    };

    const handleEditSave = async () => {
        if (!editingUser) return;
        if (!editForm.username || !editForm.email) return alert("用户名和邮箱不能为空");
        
        try {
            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-password': localStorage.getItem('admin_password') || '' 
                },
                body: JSON.stringify({
                    username: editForm.username,
                    email: editForm.email,
                    password: editForm.password || undefined // Only send if set
                })
            });
            
            if(res.ok) {
                alert("用户信息更新成功");
                setEditingUser(null);
                loadUsers();
            } else {
                const err = await res.json();
                alert("更新失败: " + (err.error || "Unknown Error"));
            }
        } catch(e) { alert("网络错误"); }
    };

    const handleRecharge = async () => {
        if (!rechargingUser) return;
        try {
            const res = await fetch(`/api/users/${rechargingUser.id}/credits`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-password': localStorage.getItem('admin_password') || '' 
                },
                body: JSON.stringify({ amount: rechargeAmount })
            });
            if(res.ok) {
                alert("充值/扣除成功");
                setRechargingUser(null);
                loadUsers();
            } else {
                alert("操作失败");
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
        <div className="max-w-6xl mx-auto space-y-8 relative">
            
            {/* --- MODALS --- */}
            
            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">编辑用户</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">昵称</label>
                                <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">邮箱</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">重置密码 (留空不修改)</label>
                                <input type="password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} placeholder="New Password" className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={handleEditSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">保存</button>
                                <button onClick={() => setEditingUser(null)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recharge Modal */}
            {rechargingUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-white mb-2">额度调整</h3>
                        <p className="text-sm text-slate-400 mb-6">当前用户: <span className="text-white">{rechargingUser.username}</span> (余额: {rechargingUser.credits})</p>
                        
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <button onClick={() => setRechargeAmount(p => p - 1)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">-</button>
                            <input 
                                type="number" 
                                value={rechargeAmount} 
                                onChange={e => setRechargeAmount(parseInt(e.target.value) || 0)}
                                className="w-24 bg-black border border-white/10 rounded-lg p-2 text-center text-white font-bold text-xl"
                            />
                            <button onClick={() => setRechargeAmount(p => p + 1)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">+</button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">* 输入负数可扣除点数</p>

                        <div className="flex gap-2">
                            <button onClick={handleRecharge} className="flex-1 py-2 bg-lime-600 hover:bg-lime-500 text-black font-bold rounded-lg transition-colors">确认调整</button>
                            <button onClick={() => setRechargingUser(null)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors">取消</button>
                        </div>
                    </div>
                </div>
            )}


            {/* --- MAIN UI --- */}
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
                                <button onClick={() => openEdit(u)} className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500 hover:text-white transition-colors">
                                    编辑
                                </button>
                                <button onClick={() => { setRechargingUser(u); setRechargeAmount(5); }} className="px-3 py-1.5 rounded bg-lime-500/10 text-lime-400 text-xs font-bold hover:bg-lime-500 hover:text-black transition-colors">
                                    充值
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
