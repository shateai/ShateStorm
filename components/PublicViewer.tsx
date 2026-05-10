
import React, { useState } from 'react';
import { Presentation, Slide } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Share2, Rocket, ArrowLeft, Loader2, Play, Volume2, Maximize2 } from 'lucide-react';

interface PublicViewerProps {
  presentation: Presentation;
  onBackToExplore?: () => void;
}

export const PublicViewer: React.FC<PublicViewerProps> = ({ presentation, onBackToExplore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlide = presentation.slides[currentIndex];

  const handleNext = () => {
    if (currentIndex < presentation.slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const shareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${presentation.id}`;
    navigator.clipboard.writeText(url);
    alert("Odkaz byl zkopírován do schránky.");
  };

  if (!currentSlide) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden flex flex-col">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-6">
          {onBackToExplore && (
            <button 
              onClick={onBackToExplore}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1 block">Veřejná Projekce</span>
            <h1 className="text-xl font-black tracking-tight">{presentation.presentationTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">
               Segment {currentIndex + 1} / {presentation.slides.length}
           </div>
           <button 
             onClick={shareLink}
             className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40"
           >
             <Share2 className="w-4 h-4" />
             Sdílet
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow relative z-10 flex flex-col items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-6xl aspect-video bg-black/40 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Visual Side */}
          <div className={`relative ${currentSlide.layout === 'full-image' ? 'w-full h-full' : 'w-full md:w-3/5 h-1/2 md:h-full'} bg-slate-900 group/visual`}>
            {(currentSlide.imageUrl || currentSlide.imageBase64) ? (
              <img 
                src={currentSlide.imageUrl || (currentSlide.imageBase64 ? `data:image/png;base64,${currentSlide.imageBase64}` : '')} 
                className="w-full h-full object-cover grayscale-[30%] group-hover/visual:grayscale-0 transition-all duration-1000" 
                alt={currentSlide.title} 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-950">
                 <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 uppercase tracking-[0.2em]">Načítám hologram...</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
            
            {currentSlide.layout === 'full-image' && (
              <div className="absolute inset-x-0 bottom-0 p-16 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter max-w-3xl"
                >
                  {currentSlide.title}
                </motion.h2>
              </div>
            )}
          </div>

          {/* Content Side */}
          {currentSlide.layout !== 'full-image' && (
            <div className="w-full md:w-2/5 h-1/2 md:h-full p-12 md:p-16 flex flex-col justify-center bg-black/40 backdrop-blur-xl">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-4">
                  <div className="h-0.5 w-10 bg-blue-500"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Klíčová Data</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter">
                  {currentSlide.title}
                </h2>

                <div className="space-y-6 pt-4">
                  {currentSlide.bulletPoints.map((bp, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-2.5 w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                      <p className="text-lg md:text-xl font-medium text-slate-300 leading-relaxed">{bp}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Navigation Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-8">
             <button 
               onClick={handlePrev}
               disabled={currentIndex === 0}
               className="pointer-events-auto p-4 bg-black/20 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/5 text-white disabled:opacity-0 transition-all hover:scale-110 active:scale-95"
             >
                <ChevronLeft className="w-8 h-8" />
             </button>
             <button 
               onClick={handleNext}
               disabled={currentIndex === presentation.slides.length - 1}
               className="pointer-events-auto p-4 bg-black/20 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/5 text-white disabled:opacity-0 transition-all hover:scale-110 active:scale-95"
             >
                <ChevronRight className="w-8 h-8" />
             </button>
          </div>
        </div>

        {/* Footer controls */}
        <div className="mt-12 flex items-center gap-8">
           <div className="h-px w-24 bg-white/5"></div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projekt SHATE</span>
              <Rocket className="w-4 h-4 text-blue-500/40" />
           </div>
           <div className="h-px w-24 bg-white/5"></div>
        </div>
      </div>
    </div>
  );
};
