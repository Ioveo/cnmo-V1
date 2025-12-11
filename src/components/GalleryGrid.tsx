
// src/components/GalleryGrid.tsx

import React, { useState } from 'react';
import { GalleryImage } from '../types';

export const GalleryGrid = React.memo(({ images }: { images: GalleryImage[] }) => {
  const [active, setActive] = useState<GalleryImage | null>(null);
  if (!images.length) return null;

  return (
    <div className="w-full">
        {/* Large Masonry Waterfall Layout */}
        <div className="columns-2 md:columns-3 gap-6 space-y-6">
            {images.map(img => (
                <div 
                    key={img.id} 
                    onClick={() => setActive(img)} 
                    className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer bg-[#111]"
                >
                    <img src={img.url} className="w-full h-auto block rounded-2xl border border-white/5 group-hover:border-purple-500/50 transition-all duration-500" loading="lazy" />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                         <span className="text-white text-lg font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{img.title}</span>
                         <span className="text-xs text-purple-400 font-mono uppercase mt-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">View Image</span>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Lightbox */}
        {active && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={() => setActive(null)}>
                <div className="relative max-w-6xl w-full max-h-[95vh] flex items-center justify-center">
                    <img src={active.url} className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" />
                    <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
                         <span className="inline-block px-6 py-3 bg-black/60 backdrop-blur rounded-full text-white text-base font-bold border border-white/10">
                             {active.title}
                         </span>
                    </div>
                    <button className="absolute top-[-40px] right-0 text-white/50 hover:text-white text-3xl transition-colors">✕</button>
                </div>
            </div>
        )}
    </div>
  );
});
