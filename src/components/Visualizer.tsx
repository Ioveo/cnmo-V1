// src/components/Visualizer.tsx


import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    // Initialize Audio Context
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Connect Source (Robustly)
    if (!sourceRef.current) {
      try {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        // Use try-catch for MediaElementSource creation as it fails if CORS is tainted
        sourceRef.current = ctx.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } catch (e) {
        console.warn("Visualizer failed to connect to audio source (likely CORS or state issue). Audio will still play.", e);
        // We do NOT return here, we allow the component to render a blank/idle state instead of crashing
      }
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const analyser = analyserRef.current;

    if (!canvasCtx) return;

    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);
      
      // If analyser failed to init, just draw idle state
      if (!analyser) {
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; 

        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#6366f1'); 
        gradient.addColorStop(1, '#a855f7'); 

        canvasCtx.fillStyle = gradient;
        
        canvasCtx.beginPath();
        canvasCtx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        canvasCtx.fill();

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      renderFrame();
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioElement, isPlaying]);

  return (
    <div className="w-full h-48 bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800 relative">
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={200} 
            className="w-full h-full block"
        />
        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-slate-500 text-sm font-medium tracking-widest uppercase">可视化频谱待机中</span>
            </div>
        )}
    </div>
  );
};