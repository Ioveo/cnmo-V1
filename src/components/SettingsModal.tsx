
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetDemoData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onResetDemoData }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setApiKey(localStorage.getItem('gemini_api_key') || '');
    setStatus('idle');
    setMsg('');
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
        setStatus('error');
        setMsg("请输入 API Key");
        return;
    }

    setStatus('testing');
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
        // Try a minimal generation to test the key
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: 'Ping' }] },
        });
        setStatus('success');
        setMsg("连接成功！API Key 有效。");
    } catch (e: any) {
        setStatus('error');
        setMsg("连接失败: " + (e.message || "无效的 Key 或网络错误"));
    }
  };

  const handleSave = () => {
    if (apiKey.trim()) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
        // Reload to ensure services pick up the new key if it changed
        window.location.reload();
    } else {
        onClose();
    }
  };

  const handleReset = () => {
      if (confirm("确定要重置并加载演示数据吗？这将覆盖当前的某些本地状态 (不会删除云端文件)。")) {
          onResetDemoData();
          onClose();
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            系统设置
        </h3>

        <div className="space-y-6">
            <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                    Gemini API Key
                </label>
                <div className="relative">
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setStatus('idle'); }}
                        placeholder="AIzaSy..."
                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-lime-500 focus:outline-none font-mono pr-20"
                    />
                    <button 
                        onClick={handleTestConnection}
                        disabled={status === 'testing'}
                        className="absolute right-1 top-1 bottom-1 px-3 bg-white/10 hover:bg-white/20 text-xs text-white rounded font-bold transition-colors disabled:opacity-50"
                    >
                        {status === 'testing' ? '测试中...' : '测试连接'}
                    </button>
                </div>
                {status !== 'idle' && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${status === 'success' ? 'text-lime-500' : 'text-red-500'}`}>
                        {status === 'success' ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {msg}
                    </p>
                )}
                <p className="text-[10px] text-slate-500 mt-2">
                    NEXUS 需要 Google Gemini API 支持以进行音频分析和创意生成。Key 仅保存在您的本地浏览器中。
                </p>
            </div>
            
            <button 
                onClick={handleSave}
                className="w-full py-3 bg-white hover:bg-slate-200 text-black font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg mt-2"
            >
                保存配置并重启
            </button>

            <div className="pt-4 border-t border-white/10">
                <button 
                    onClick={handleReset}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-500 hover:text-white font-bold uppercase tracking-wider rounded-xl transition-all text-xs"
                >
                    Initialize Demo Data (重置/加载演示数据)
                </button>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                    如果页面空白或数据丢失，请点击此按钮恢复 30 条预设内容。
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
