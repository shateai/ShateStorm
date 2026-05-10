
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Play, Square, Volume2, 
  Download, Share2, Edit2, Image as ImageIcon, 
  Mic, Trash2, Plus, ArrowLeft, Loader2, Sparkles,
  ExternalLink, Globe, Lock, Save, X, RefreshCw
} from 'lucide-react';
import { Presentation, Slide } from '../types';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import pptxgen from 'pptxgenjs';

interface PresentationViewerProps {
  data: Presentation;
  loadingStatus: string;
  onReset: () => void;
  onUpdateSlide: (index: number, updates: Partial<Slide>) => void;
  onAddSlide: (title: string, bullets: string[]) => void;
  onDelete: (id: string) => void;
  onRegenerateAudio: (index: number) => void;
  onRegenerateImage: (index: number) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  data, loadingStatus, onReset, onUpdateSlide, onAddSlide, onDelete, onRegenerateAudio, onRegenerateImage, onTogglePublic
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  
  const currentSlide = data.slides[currentIndex];

  useEffect(() => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    if (isPlaying && currentSlide?.audioUrl) {
      const newAudio = new Audio(currentSlide.audioUrl);
      newAudio.play();
      newAudio.onended = () => {
        if (currentIndex < data.slides.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setIsPlaying(false);
        }
      };
      setAudio(newAudio);
    }
  }, [currentIndex, isPlaying, data.slides.length]);

  const handleNext = () => {
    if (currentIndex < data.slides.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const exportPPTX = async () => {
    setIsExporting(true);
    const pres = new pptxgen();
    data.slides.forEach(slide => {
      const s = pres.addSlide();
      s.background = { color: '020617' };
      s.addText(slide.title, { x: 0.5, y: 0.5, w: '90%', fontSize: 32, color: 'ffffff', bold: true });
      slide.bulletPoints.forEach((bp, i) => {
        s.addText(`- ${bp}`, { x: 0.5, y: 1.5 + (i * 0.5), w: '50%', fontSize: 18, color: 'cccccc' });
      });
      if (slide.imageUrl) {
        s.addImage({ path: slide.imageUrl, x: 5.5, y: 1.5, w: 4, h: 3 });
      }
    });
    pres.writeFile({ fileName: `${data.presentationTitle.replace(/\s+/g, '_')}.pptx` });
    setIsExporting(false);
  };

  const togglePublic = () => {
    onTogglePublic(data.id, !data.isPublic);
  };

  const shareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${data.id}`;
    navigator.clipboard.writeText(url);
    alert("Odkaz na veřejnou prezentaci byl zkopírován.");
  };

  if (!currentSlide) return <div className="p-20 text-center">Slide nenalezen</div>;

  return (
    <div className="min-h-screen bg-[#020617] pt-28 pb-10 px-6 flex flex-col">
       {/* Background Ambience */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/5 rounded-full blur-[150px]"></div>
       </div>

       <div className="container mx-auto max-w-7xl relative z-10 flex-grow flex flex-col">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 glass-card p-6 border-none rounded-3xl bg-white/[0.02]">
             <div className="flex items-center gap-6">
                <button onClick={onReset} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                   <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                   <h1 className="text-2xl font-black tracking-tight">{data.presentationTitle}</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Stav: </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Operační</span>
                   </div>
                </div>
             </div>

             <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isPlaying ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  }`}
                >
                   {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                   {isPlaying ? 'Zastavit' : 'Spustit Prezentaci'}
                </button>

                <div className="h-8 w-px bg-white/5 mx-2"></div>

                <button 
                  onClick={togglePublic}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black transition-all ${
                    data.isPublic ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}
                >
                   {data.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                   {data.isPublic ? 'Veřejné' : 'Soukromé'}
                </button>

                {data.isPublic && (
                  <button onClick={shareLink} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 transition-all">
                    <Share2 className="w-4 h-4" />
                  </button>
                )}

                <button 
                   onClick={exportPPTX}
                   disabled={isExporting}
                   className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all"
                >
                   {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                   Export .pptx
                </button>
             </div>
          </div>

          {/* Main Viewer Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
             {/* Slide Canvas */}
             <div className="lg:col-span-9 flex flex-col gap-6">
                <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden group">
                   <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="absolute inset-0 flex flex-col md:flex-row"
                      >
                         {/* Visual Side */}
                         <div className={`relative ${currentSlide.layout === 'full-image' ? 'w-full h-full' : 'w-full md:w-3/5 h-1/2 md:h-full'} bg-slate-950 overflow-hidden`}>
                            {currentSlide.imageUrl || currentSlide.imageBase64 ? (
                              <img 
                                src={currentSlide.imageUrl || (currentSlide.imageBase64 ? `data:image/png;base64,${currentSlide.imageBase64}` : '')} 
                                className="w-full h-full object-cover transition-all duration-[20s] scale-105 group-hover:scale-110" 
                                alt={currentSlide.title} 
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                 <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Generuji Vizualizaci...</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                         </div>

                         {/* Content Side */}
                         {currentSlide.layout !== 'full-image' && (
                            <div className="w-full md:w-2/5 h-1/2 md:h-full p-12 flex flex-col justify-center bg-slate-900 border-l border-white/5">
                               <div className="flex items-center gap-3 mb-8">
                                  <div className="h-0.5 w-8 bg-blue-500"></div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Data modulu</span>
                               </div>
                               <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-8">{currentSlide.title}</h2>
                               <div className="space-y-4">
                                  {currentSlide.bulletPoints.map((bp, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                       <div className="mt-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                       <p className="text-lg font-medium text-slate-300 leading-relaxed">{bp}</p>
                                    </div>
                                  ))}
                               </div>
                            </div>
                         )}
                      </motion.div>
                   </AnimatePresence>

                   {/* Nav Buttons Overlay */}
                   <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                      <button onClick={handlePrev} disabled={currentIndex === 0} className="p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/5 text-white disabled:opacity-0 transition-all pointer-events-auto active:scale-90">
                         <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button onClick={handleNext} disabled={currentIndex === data.slides.length - 1} className="p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/5 text-white disabled:opacity-0 transition-all pointer-events-auto active:scale-90">
                         <ChevronRight className="w-6 h-6" />
                      </button>
                   </div>
                </div>

                {/* Progress Bar */}
                <div className="grid grid-cols-12 gap-2 h-1.5">
                   {data.slides.map((_, i) => (
                      <div 
                        key={i} 
                        onClick={() => setCurrentIndex(i)}
                        className={`h-full rounded-full cursor-pointer transition-all ${
                          i === currentIndex ? 'bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 
                          i < currentIndex ? 'bg-blue-900/40' : 'bg-white/5'
                        }`} 
                        style={{ gridColumn: 'span 1' }}
                      />
                   ))}
                </div>

                {/* Speaker Notes */}
                <div className="glass-card rounded-[2rem] p-10 border-none bg-white/[0.02] flex gap-8 items-start">
                   <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center shrink-0">
                      <Volume2 className="w-6 h-6 text-purple-400" />
                   </div>
                   <div className="flex-grow">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Poznámky řečníka (AI Skript)</span>
                         <div className="flex items-center gap-2">
                            {currentSlide.audioUrl && <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> Synchronizováno</span>}
                            <button 
                               onClick={() => onRegenerateAudio(currentIndex)}
                               className="p-2 text-slate-500 hover:text-white transition-colors"
                            >
                               <RefreshCw className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed italic text-lg font-medium pr-10">
                        {currentSlide.speakerNotes}
                      </p>
                   </div>
                </div>
             </div>

             {/* Tools Sidebar */}
             <div className="lg:col-span-3 space-y-6">
                <div className="glass-card rounded-[2.5rem] p-8 border-none bg-white/[0.02]">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 border-b border-white/5 pb-4">Nástroje Segmentu</h3>
                   <div className="space-y-4">
                      <ToolBtn icon={<Edit2 className="w-4 h-4" />} label="Upravit Obsah" onClick={() => {}} />
                      <ToolBtn icon={<ImageIcon className="w-4 h-4" />} label="Změnit Vizualizaci" onClick={() => onRegenerateImage(currentIndex)} />
                      <ToolBtn icon={<RefreshCw className="w-4 h-4" />} label="Přegenerovat Dabing" onClick={() => onRegenerateAudio(currentIndex)} />
                      <div className="h-px bg-white/5 my-4"></div>
                      <ToolBtn icon={<Plus className="w-4 h-4" />} label="Vložit Segment" onClick={() => onAddSlide("Nový Segment", ["Důležitý bod 1"])} />
                      <ToolBtn icon={<Trash2 className="w-4 h-4" />} label="Eliminovat Segment" onClick={() => onDelete(data.id)} className="text-red-500/60 hover:text-red-400 hover:bg-red-500/5" />
                   </div>
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 border-none bg-blue-600/5 border border-blue-500/10">
                   <div className="flex items-center gap-3 mb-6">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Inspirace SHATE</h4>
                   </div>
                   <p className="text-[11px] text-slate-500 leading-relaxed mb-6">Navrhuji použít rozložení "Full Screen Image" pro tento slajd, aby vynikl vizuální detail.</p>
                   <button className="w-full py-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Aplikovat Návrh</button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const ToolBtn = ({ icon, label, onClick, className = "" }: { icon: React.ReactNode, label: string, onClick: () => void, className?: string }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/10 transition-all font-bold text-xs ${className}`}
    >
        {icon}
        {label}
    </button>
);
