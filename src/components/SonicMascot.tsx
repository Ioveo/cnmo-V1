
// src/components/SonicMascot.tsx

import React, { useState, useEffect, useRef } from 'react';

interface SonicMascotProps {
  isPlaying: boolean;
  audioData?: Uint8Array; 
  sourceType: 'local' | 'external' | 'netease' | 'qq' | 'link' | null;
}

export const SonicMascot: React.FC<SonicMascotProps> = ({ isPlaying, audioData, sourceType }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [relPos, setRelPos] = useState({ x: 0, y: 0 });
  const [energy, setEnergy] = useState(1);
  const mascotRef = useRef<HTMLDivElement>(null);

  // --- Dragging Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mascotRef.current) return;
    setIsDragging(true);
    const rect = mascotRef.current.getBoundingClientRect();
    setRelPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Boundary checks
      const newX = Math.min(Math.max(0, e.clientX - relPos.x), window.innerWidth - 80);
      const newY = Math.min(Math.max(0, e.clientY - relPos.y), window.innerHeight - 80);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, relPos]);

  // --- Beat Simulation Logic ---
  useEffect(() => {
    let animationFrame: number;
    
    const loop = (timestamp: number) => {
      if (!isPlaying) {
        setEnergy(1);
        return;
      }

      // 1. Real Audio Reactivity (Local Files)
      if (sourceType === 'local' && audioData && audioData.length > 0) {
        let sum = 0;
        const bassBins = 8;
        for(let i=0; i<bassBins; i++) sum += audioData[i];
        const avg = sum / bassBins;
        const scale = 1 + (avg / 255) * 0.4;
        setEnergy(scale);
      } 
      // 2. Simulated Reactivity (External)
      else {
        const beatDuration = 500; 
        const progress = (timestamp % beatDuration) / beatDuration;
        if (progress < 0.2) {
             setEnergy(1 + (progress * 5) * 0.25);
        } else {
             setEnergy(1.25 - ((progress - 0.2) * 1.25) * 0.25);
        }
      }

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, audioData, sourceType]);


  return (
    <div 
      ref={mascotRef}
      onMouseDown={handleMouseDown}
      className="fixed z-[180] cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out select-none group"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: `scale(${energy})`,
      }}
    >
      {/* --- NANO PULSE SPHERE --- */}
      <div className="relative w-24 h-24 flex items-center justify-center">
         
         {/* Outer Holographic Rings */}
         <div className={`absolute inset-0 rounded-full border border-cyan-400/30 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'opacity-50'}`}></div>
         <div className={`absolute inset-2 rounded-full border border-lime-400/30 ${isPlaying ? 'animate-[spin_3s_linear_infinite_reverse]' : 'opacity-50'}`}></div>

         {/* Core Sphere */}
         <div className="relative w-16 h-16 rounded-full bg-black border border-white/20 shadow-[0_0_30px_rgba(204,255,0,0.2)] flex items-center justify-center overflow-hidden z-10">
             
             {/* Gloss */}
             <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>

             {/* Digital Face */}
             <div className="flex gap-2 items-center">
                 {isPlaying ? (
                    <>
                        <div className="w-3 h-1 bg-acid rounded-full animate-pulse shadow-[0_0_5px_#ccff00]"></div>
                        <div className="w-3 h-1 bg-acid rounded-full animate-pulse shadow-[0_0_5px_#ccff00]" style={{ animationDelay: '0.1s' }}></div>
                    </>
                 ) : (
                    <>
                        <div className="w-2 h-2 rounded-full border-2 border-cyan-500/50"></div>
                        <div className="w-2 h-2 rounded-full border-2 border-cyan-500/50"></div>
                    </>
                 )}
             </div>
             
             {/* Core Glow */}
             <div className={`absolute inset-0 bg-acid/10 rounded-full blur-md ${isPlaying ? 'animate-pulse' : 'opacity-0'}`}></div>
         </div>

         {/* Floating Satellites */}
         <div className={`absolute -top-2 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#06b6d4] ${isPlaying ? 'animate-[bounce_2s_infinite]' : ''}`}></div>
         <div className={`absolute -bottom-2 right-1/2 w-1.5 h-1.5 bg-acid rounded-full shadow-[0_0_5px_#ccff00] ${isPlaying ? 'animate-[bounce_1.5s_infinite]' : ''}`}></div>

      </div>
    </div>
  );
};
