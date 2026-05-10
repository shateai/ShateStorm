
import React, { useState, useEffect, useRef } from 'react';
import { Presentation, Slide } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Volume2, Info, Globe, Loader2, ArrowLeft } from 'lucide-react';

interface PublicViewerProps {
  presentation: Presentation;
  onBackToExplore?: () => void;
}

export const PublicViewer: React.FC<PublicViewerProps> = ({ presentation, onBackToExplore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  useEffect(() => {
    // Reset audio state when slide changes
    setIsPlayingAudio(false);
  }, [currentIndex]);

  if (!currentSlide) return null;

  return (
    <div className="fixed inset-0 bg-[#020617] text-white z-[100] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-slate-950/80 backdrop-blur-xl border-bottom border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          {onBackToExplore && (
            <button 
              onClick={onBackToExplore}
              className="p-2 hover:bg-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight">{presentation.presentationTitle}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Globe className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Veřejná Edukační Mise</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Stránka {currentIndex + 1} z {presentation.slides.length}</span>
          </div>
        </div>
      </div>

      {/* Main Player */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            className="w-full max-w-6xl aspect-video bg-black/40 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
          >
            {/* Visual Side */}
            <div className={`relative ${currentSlide.layout === 'full-image' ? 'w-full h-full' : 'w-full md:w-3/5 h-1/2 md:h-full'} bg-slate-900 group/visual`}>
              {(currentSlide.imageUrl || currentSlide.imageBase64) ? (
                <img 
                  src={currentSlide.imageUrl || (currentSlide.imageBase64 ? `data:image/png;base64,${currentSlide.imageBase64}` : '')} 
                  className="w-full h-full object-cover grayscale-[30%] group-hover/visual:grayscale-0 transition-all duration-1000" 
                  alt={currentSlide.title} 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-900">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 uppercase">Načítám hologram...</span>
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
              <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center bg-slate-950/40 relative">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-8 tracking-tighter leading-tight">
                  {currentSlide.title}
                </h2>
                <div className="space-y-4">
                  {currentSlide.bulletPoints.map((point, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4"
                    >
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                       <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">{point}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Speaker Notes Reveal (Only for curious viewers) */}
                <div className="mt-12 pt-8 border-t border-white/5 group">
                   <div className="flex items-center gap-2 mb-3 text-slate-500">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Podrobnosti mise</span>
                   </div>
                   <p className="text-sm text-slate-400 line-clamp-3 group-hover:line-clamp-none transition-all cursor-help italic leading-relaxed">
                      {currentSlide.speakerNotes}
                   </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-14 h-14 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 text-white pointer-events-auto transition-all ${currentIndex === 0 ? 'opacity-0 cursor-default' : 'hover:bg-white/10 hover:scale-110 active:scale-90'}`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={handleNext}
            disabled={currentIndex === presentation.slides.length - 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center bg-blue-600 border border-blue-500 text-white pointer-events-auto transition-all shadow-xl shadow-blue-500/20 ${currentIndex === presentation.slides.length - 1 ? 'opacity-0 cursor-default' : 'hover:bg-blue-500 hover:scale-110 active:scale-90'}`}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-8 flex justify-center items-center gap-8 relative z-10">
        {(currentSlide.audioUrl || currentSlide.audioBase64) && (
          <div className="flex flex-col items-center gap-3">
             <button 
               onClick={toggleAudio}
               className={`group flex items-center gap-4 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${isPlayingAudio ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
             >
                <div className={`w-2 h-2 rounded-full ${isPlayingAudio ? 'bg-white animate-pulse' : 'bg-slate-600'}`}></div>
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingAudio ? 'Zastavit Dabing' : 'Přehrát Dabing'}</span>
             </button>
             <audio 
               ref={audioRef} 
               src={currentSlide.audioUrl || (currentSlide.audioBase64 ? `data:audio/mp3;base64,${currentSlide.audioBase64}` : '')} 
               onEnded={() => setIsPlayingAudio(false)}
             />
          </div>
        )}

        <div className="flex items-center gap-2">
           {presentation.slides.map((_, i) => (
             <button 
               key={i} 
               onClick={() => setCurrentIndex(i)}
               className={`h-1.5 transition-all rounded-full ${i === currentIndex ? 'w-8 bg-blue-500' : 'w-2 bg-slate-800 hover:bg-slate-700'}`}
             />
           ))}
        </div>
      </div>
    </div>
  );
};
