
// src/components/SystemConfigManager.tsx

import React, { useState, useEffect } from 'react';
import { SiteConfig, SystemConfig } from '../types';
import { storageService } from '../services/storageService';

interface SystemConfigManagerProps {
    onResetDemoData?: () => void;
}

export const SystemConfigManager: React.FC<SystemConfigManagerProps> = ({ onResetDemoData }) => {
    const [config, setConfig] = useState<SystemConfig>({});
    const [loading, setLoading] = useState(false);
    
    // Config fetch on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            // New endpoint for full system config (including sensitive fields if admin)
            const res = await fetch('/api/system-config', {
                headers: { 'x-admin-password': localStorage.getItem('admin_password') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (e) {
            console.error("Failed to load system config");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/system-config', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-password': localStorage.getItem('admin_password') || '' 
                },
                body: JSON.stringify(config)
            });
            if (res.ok) alert("系统配置保存成功");
            else alert("保存失败");
        } catch (e) {
            alert("网络错误");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (confirm("确定要重置并加载演示数据吗？这将覆盖当前的某些本地状态 (不会删除云端文件)。")) {
            if (onResetDemoData) onResetDemoData();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-white/10 pb-6">
                <h3 className="text-3xl font-display font-bold text-white mb-1">后端系统配置</h3>
                <p className="text-xs text-slate-500 font-mono">管理 API 密钥与邮件服务 (敏感信息)</p>
            </div>

            <div className="bg-[#111] p-8 rounded-2xl border border-white/10 space-y-8">
                {/* AI Configuration */}
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">AI 引擎配置</h4>
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gemini API Key</label>
                        <input 
                            type="password" 
                            value={config.geminiApiKey || ''} 
                            onChange={e => setConfig({...config, geminiApiKey: e.target.value})} 
                            placeholder="AIzaSy..."
                            className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-acid font-mono"
                        />
                        <p className="text-[10px] text-slate-600">
                            * 此 Key 将安全存储在后端 KV 中，用户无法查看。
                        </p>
                    </div>
                </div>

                {/* SMTP Configuration */}
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">邮箱服务配置 (SMTP)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Host</label>
                            <input type="text" value={config.smtpConfig?.host || ''} onChange={e => setConfig({...config, smtpConfig: {...config.smtpConfig, host: e.target.value} as any})} placeholder="smtp.example.com" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Port</label>
                            <input type="number" value={config.smtpConfig?.port || ''} onChange={e => setConfig({...config, smtpConfig: {...config.smtpConfig, port: parseInt(e.target.value)} as any})} placeholder="465" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Username</label>
                            <input type="text" value={config.smtpConfig?.user || ''} onChange={e => setConfig({...config, smtpConfig: {...config.smtpConfig, user: e.target.value} as any})} placeholder="sender@example.com" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Password</label>
                            <input type="password" value={config.smtpConfig?.pass || ''} onChange={e => setConfig({...config, smtpConfig: {...config.smtpConfig, pass: e.target.value} as any})} placeholder="••••••••" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500" />
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">From Name/Address</label>
                            <input type="text" value={config.smtpConfig?.from || ''} onChange={e => setConfig({...config, smtpConfig: {...config.smtpConfig, from: e.target.value} as any})} placeholder="NEXUS <no-reply@nexus.com>" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:bg-slate-200">
                        {loading ? 'Saving...' : '保存系统配置'}
                    </button>
                </div>

                {/* DANGER ZONE */}
                <div className="pt-8 border-t border-white/10">
                    <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4">危险区域 (Danger Zone)</h4>
                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <h5 className="text-white font-bold text-sm">初始化演示数据</h5>
                            <p className="text-slate-400 text-xs mt-1">如果页面空白或数据丢失，点击此按钮可恢复 30 条预设内容到本地状态。</p>
                        </div>
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            执行重置
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
};
