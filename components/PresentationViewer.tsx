
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Presentation, Slide, DraftSlide } from '../types';
import { ChevronLeft, ChevronRight, Download, RefreshCw, MonitorPlay, Wand2, X, Info, Layout, Printer, Image as ImageIcon, CheckCircle2, AlertTriangle, Upload, Sparkles, Loader2, Save, Volume2, VolumeX, Trash2, Globe, Link as LinkIcon, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePPTX } from '../services/pptxService';
import { generateHTMLPresentation, ExportOptions } from '../services/htmlExportService';
import { updateSlideContent, generateSlideImage, validateImage, generateSlideAudio } from '../services/geminiService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { togglePresentationPublic } from '../services/firebaseService';
import { ChatSidebar } from './ChatSidebar';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

interface PresentationViewerProps {
  data: Presentation; 
  loadingStatus: string;
  onReset: () => void;
  onUpdateSlide: (index: number, updates: Partial<Slide>) => void;
  onAddSlide: (title: string, bulletPoints: string[]) => void;
  onDelete: (id: string) => void;
  onRegenerateAudio?: (index: number) => void;
  onRegenerateImage?: (index: number) => void;
  onTogglePublic?: (id: string, isPublic: boolean) => void;
}

// Floating elements component
const FloatingBackground = () => {
    const elements = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            type: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'triangle' : 'square',
            size: Math.random() * 60 + 20,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 5,
            opacity: Math.random() * 0.15 + 0.05
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {elements.map(el => (
                <motion.div
                    key={el.id}
                    initial={{ x: `${el.x}%`, y: `${el.y}%`, opacity: 0 }}
                    animate={{ 
                        x: [`${el.x}%`, `${(el.x + 10) % 100}%`, `${el.x}%`],
                        y: [`${el.y}%`, `${(el.y + 10) % 100}%`, `${el.y}%`],
                        opacity: [el.opacity, el.opacity * 1.5, el.opacity],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: el.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: el.delay
                    }}
                    style={{
                        position: 'absolute',
                        width: el.size,
                        height: el.size,
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: el.type === 'circle' ? '50%' : el.type === 'triangle' ? '0' : '8px',
                        clipPath: el.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                        background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.2), transparent)',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)'
                    }}
                />
            ))}
        </div>
    );
};

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ 
  data, 
  loadingStatus, 
  onReset, 
  onUpdateSlide, 
  onAddSlide, 
  onDelete,
  onRegenerateAudio,
  onRegenerateImage,
  onTogglePublic
}) => {
  const [editableTitle, setEditableTitle] = useState(data?.presentationTitle || data?.topic || "Prezentace");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [exportTab, setExportTab] = useState<'files' | 'guide'>('files');
  const [isEditing, setIsEditing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [aiUpdatePrompt, setAiUpdatePrompt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeAudio: true, includeNotes: true, includeSources: true,
    includeAnimations: true, includeDecorations: true, format: 'html'
  });
  
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const totalSlides = data?.slides?.length || 0;
  const totalPages = totalSlides + ((data?.sources?.length || 0) > 0 ? 1 : 0);

  useEffect(() => {
    const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentSlide = data?.slides?.[currentIndex];
  const nextSlide = () => { if (currentIndex < totalPages - 1) setCurrentIndex(prev => prev + 1); };
  const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const audioSrc = currentSlide?.audioUrl || (currentSlide?.audioBase64 ? `data:audio/mp3;base64,${currentSlide.audioBase64}` : null);
      if (audioSrc) {
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
        audioRef.current.pause();
    }
  }, [currentIndex]);

  const handleDownloadImages = async () => {
    const zip = new JSZip();
    const slidesElements = document.querySelectorAll('.slide-card-raw');
    
    setIsUpdating(true);
    for (let i = 0; i < slidesElements.length; i++) {
        const canvas = await html2canvas(slidesElements[i] as HTMLElement, { 
            backgroundColor: '#020617', 
            scale: 2,
            useCORS: true
        });
        const dataUrl = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`slide_${i + 1}.png`, dataUrl, { base64: true });
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editableTitle}_fotky.zip`;
    a.click();
    setIsUpdating(false);
    setIsExportDialogOpen(false);
  };

  const handleUpdateSlideAI = async () => {
    if (!currentSlide || !aiUpdatePrompt) return;
    setIsUpdating(true);
    const updates = await updateSlideContent(currentSlide, aiUpdatePrompt);
    
    // If image changed (hypothetically, gemini might change imagePrompt, but usually it doesn't return base64 here)
    // Actually updateSlideContent might return a new image if requested.
    // Our current updateSlideContent (I should check) usually just returns text updates.
    
    onUpdateSlide(currentIndex, updates);
    setAiUpdatePrompt("");
    setIsUpdating(false);
  };

  const getAspectRatio = (layout?: string) => {
    switch (layout) {
      case 'full-image': return "16:9";
      case 'vertical': return "16:9";
      case 'standard':
      case 'reversed': return "4:3";
      case 'big-title': return "1:1";
      default: return "1:1";
    }
  };

  const handleRegenerateImage = async (index: number = currentIndex) => {
      if (onRegenerateImage) {
        onRegenerateImage(index);
        return;
      }
      const slideToUpdate = data.slides[index];
      if (!slideToUpdate) return;
      setIsUpdating(true);
      const img = await generateSlideImage(slideToUpdate.imagePrompt, getAspectRatio(slideToUpdate.layout));
      if (img) {
          const validation = await validateImage(img, slideToUpdate.title, slideToUpdate.bulletPoints);
          const url = await uploadToCloudinary(img);
          
          if (url) {
            onUpdateSlide(index, { imageBase64: img, imageUrl: url, imageValidation: validation });
            setTimeout(() => onUpdateSlide(index, { imageBase64: undefined }), 5000);
          } else {
            onUpdateSlide(index, { imageBase64: img, imageUrl: undefined, imageValidation: validation });
          }
      }
      setIsUpdating(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = async (ev) => {
              const base64 = ev.target?.result?.toString().split(',')[1];
              if (base64) {
                 setIsUpdating(true);
                 const url = await uploadToCloudinary(base64);
                 if (url) {
                    onUpdateSlide(currentIndex, { imageBase64: base64, imageUrl: url, imageValidation: undefined });
                    setTimeout(() => onUpdateSlide(currentIndex, { imageBase64: undefined }), 5000);
                 } else {
                    onUpdateSlide(currentIndex, { imageBase64: base64, imageUrl: undefined, imageValidation: undefined });
                 }
                 setIsUpdating(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleTogglePublic = async () => {
    if (!data.id) return;
    const newState = !data.isPublic;
    try {
      await togglePresentationPublic(data.id, newState);
      if (onTogglePublic) onTogglePublic(data.id, newState);
    } catch (e) {
      alert("Nepodařilo se změnit viditelnost.");
    }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${data.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Odkaz zkopírován do schránky.");
  };

  const currentPos = currentIndex === totalSlides ? { x: (data?.slides?.[totalSlides-1]?.x || 0) + 1600, y: (data?.slides?.[totalSlides-1]?.y || 0) } : { x: data?.slides?.[currentIndex]?.x || 0, y: data?.slides?.[currentIndex]?.y || 0 };
  
  // Shift camera if chat is open
  const chatShift = isChatOpen ? 200 : 0;
  const cameraX = (viewportSize.w / 2) - currentPos.x - 450 - chatShift;
  const cameraY = (viewportSize.h / 2) - currentPos.y - 270;

  return (
    <div className="fixed inset-0 bg-[#020617] overflow-hidden flex flex-col font-sans perspective-[2000px]">
      <FloatingBackground />
      
      {/* Sidebar Chatbot */}
      <ChatSidebar 
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        currentSlide={currentIndex < totalSlides ? data.slides[currentIndex] : null} 
        currentIndex={currentIndex}
        presentationTopic={data.topic || ""} 
        onUpdateSlide={onUpdateSlide}
        onAddSlide={onAddSlide}
        onRegenerateImage={(idx) => {
            const slide = data.slides[idx];
            if (slide) {
                // We'll call the local regenerate logic
                handleRegenerateImage(idx);
            }
        }}
      />

      {/* Skryté elementy pro export fotek */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none">
          {data.slides.map((slide, i) => (
               <div key={i} id={`raw-slide-${i}`} className="slide-card-raw w-[1280px] h-[720px] bg-[#0f172a] flex overflow-hidden border border-white/10 relative">
                    {slide.layout === 'full-image' ? (
                        <div className="w-full h-full relative">
                            {slide.imageUrl || slide.imageBase64 ? (
                                <img src={slide.imageUrl || `data:image/png;base64,${slide.imageBase64}`} className="w-full h-full object-cover" />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 p-16 flex flex-col justify-end">
                                <h2 className="text-white text-6xl font-black mb-6">{slide.title}</h2>
                                <ul className="space-y-4">
                                    {slide.bulletPoints.map((bp, j) => (
                                        <li key={j} className="text-slate-200 text-2xl flex items-center gap-4">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div> {bp}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : slide.layout === 'text-only' ? (
                        <div className="w-full h-full p-20 flex flex-col justify-center bg-slate-900 border-l-[20px] border-blue-600">
                             <h2 className="text-white text-7xl font-black mb-12">{slide.title}</h2>
                             <div className="space-y-8">
                                {slide.bulletPoints.map((bp, j) => (
                                    <p key={j} className="text-slate-300 text-3xl font-medium">{bp}</p>
                                ))}
                             </div>
                        </div>
                    ) : (
                        <div className={`flex w-full h-full ${slide.layout === 'reversed' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-1/2 p-20 flex flex-col justify-center">
                                <h2 className="text-white text-5xl font-black mb-10 leading-tight">{slide.title}</h2>
                                <ul className="space-y-6">
                                    {slide.bulletPoints.map((bp, j) => (
                                        <li key={j} className="text-slate-200 text-2xl flex items-start">
                                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-6 mt-3"></span> {bp}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="w-1/2 p-10 h-full">
                                {slide.imageUrl || slide.imageBase64 ? (
                                    <img src={slide.imageUrl || `data:image/png;base64,${slide.imageBase64}`} className="w-full h-full object-cover rounded-[3rem]" />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 rounded-[3rem] border border-white/5 flex items-center justify-center">
                                        <ImageIcon className="w-16 h-16 text-slate-700" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
               </div>
          ))}
      </div>

      <motion.div 
        className="absolute top-0 left-0 w-full h-full transform-style-3d"
        animate={{ x: cameraX, y: cameraY }}
        transition={{ type: 'spring', damping: 20, stiffness: 40 }}
      >
        {(data?.slides || []).map((slide, index) => {
            const isActive = index === currentIndex;
            return (
                <motion.div 
                    key={index} 
                    className={`absolute w-[900px] h-[540px] bg-[#111827]/95 backdrop-blur-3xl border border-white/5 overflow-hidden flex shadow-2xl ${slide.shape || 'rounded-2xl'}`} 
                    style={{ left: slide.x || 0, top: slide.y || 0 }}
                    animate={{ 
                        scale: isActive ? 1 : 0.95,
                        opacity: isActive ? 1 : 0.3,
                        rotateY: isActive ? 0 : index < currentIndex ? -15 : 15,
                        filter: isActive ? 'blur(0px)' : 'blur(2px)'
                    }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                >
                    <div className="w-full h-full relative">
                        {/* Renderer based on layout */}
                        {slide.layout === 'full-image' ? (
                            <div className="w-full h-full relative">
                                {slide.imageUrl || slide.imageBase64 ? (
                                     <img src={slide.imageUrl || `data:image/png;base64,${slide.imageBase64}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-slate-700"/></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-12 flex flex-col justify-end">
                                    <h3 className="font-black text-white text-4xl mb-4 leading-tight drop-shadow-2xl">{slide.title}</h3>
                                    <ul className="space-y-2">
                                        {(slide.bulletPoints || []).map((bp, idx) => (
                                            <li key={idx} className="text-slate-100 font-medium flex items-center gap-3 drop-shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></div> {bp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : slide.layout === 'vertical' ? (
                            <div className="w-full h-full flex flex-col">
                                <div className="p-10 flex-grow">
                                    <h3 className="font-black text-white text-3xl leading-tight mb-4">{slide.title}</h3>
                                    <ul className="grid grid-cols-2 gap-4">
                                        {(slide.bulletPoints || []).map((bp, idx) => (
                                            <li key={idx} className="flex items-start text-slate-200">
                                                <span className="w-1.5 h-1.5 rounded-full mt-2 mr-3 bg-blue-500 flex-shrink-0"></span> {bp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="h-[240px] w-full p-4">
                                    <img src={slide.imageUrl || `data:image/png;base64,${slide.imageBase64}`} className="w-full h-full object-cover rounded-2xl" />
                                </div>
                            </div>
                        ) : slide.layout === 'big-title' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
                                <h3 className="font-black text-white text-6xl leading-tight mb-8 tracking-tighter drop-shadow-2xl">{slide.title}</h3>
                                <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
                                    {(slide.bulletPoints || []).map((bp, idx) => (
                                        <div key={idx} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-300 font-bold text-sm">
                                            {bp}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-12 w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl">
                                     <img src={slide.imageUrl || `data:image/png;base64,${slide.imageBase64}`} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        ) : slide.layout === 'text-only' ? (
                            <div className="w-full h-full flex flex-col justify-center p-16 bg-gradient-to-br from-slate-900 to-indigo-950/20">
                                <div className="w-1.5 h-12 bg-blue-500 mb-8 rounded-full"></div>
                                <h3 className="font-black text-white text-5xl leading-tight mb-10 tracking-tight">{slide.title}</h3>
                                <div className="space-y-6">
                                    {(slide.bulletPoints || []).map((bp, idx) => (
                                        <div key={idx} className="text-xl text-slate-300 font-medium leading-relaxed max-w-2xl border-l-2 border-white/5 pl-6 hover:border-blue-500/50 transition-colors">
                                            {bp}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={`flex w-full h-full ${slide.layout === 'reversed' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="w-1/2 p-12 flex flex-col justify-center">
                                    <h3 className="font-black text-white text-3xl leading-tight mb-6 tracking-tight">{slide.title}</h3>
                                    <ul className="space-y-3">
                                        {(slide.bulletPoints || []).map((bp, idx) => (
                                            <li key={idx} className="flex items-start text-base text-slate-200 leading-relaxed font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full mt-2 mr-3 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-shrink-0"></span> {bp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {slide.imageUrl || slide.imageBase64 ? (
                                    <div className="w-1/2 p-6 h-full flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-75 opacity-50"></div>
                                        <img src={slide.imageUrl || `data:image/png;base64,${slide.imageBase64}`} className="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10" />
                                        {slide.imageValidation && (
                                            <div className={`absolute bottom-8 right-8 px-4 py-2 rounded-full backdrop-blur-2xl border flex items-center gap-2 shadow-2xl z-20 ${slide.imageValidation.isOk ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
                                                {slide.imageValidation.isOk ? <CheckCircle2 className="w-3.5 h-3.5"/> : <AlertTriangle className="w-3.5 h-3.5"/>}
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{slide.imageValidation.isOk ? 'AI Ověřeno' : 'AI Varování'}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-1/2 p-6 h-full flex items-center justify-center">
                                        <div className="w-full h-full bg-slate-800/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-slate-500 gap-4">
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                                                <ImageIcon className="w-10 h-10 opacity-10" />
                                            </motion.div>
                                            <p className="text-[8px] uppercase font-black tracking-[0.3em] opacity-40 mb-4">Vizualizace se připravuje...</p>
                                            <button 
                                                onClick={() => handleRegenerateImage(index)}
                                                className="px-4 py-2 bg-slate-900/50 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Zkusit znovu
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            );
        })}
      </motion.div>

      {/* Editor Panel */}
      {isEditing && currentSlide && (
          <div className="absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-white/10 z-[60] shadow-2xl animate-fade-in-right flex flex-col p-6">
              <div className="flex justify-between items-center mb-6">
                  <h4 className="text-white font-black text-lg flex items-center gap-2"><Wand2 className="w-4 h-4 text-blue-500"/> Upravit</h4>
                  <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white p-1"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="flex-grow space-y-6 overflow-y-auto pr-1">
                  {/* Warning if image is missing */}
                  {(!(currentSlide.imageUrl || currentSlide.imageBase64) || !(currentSlide.audioUrl || currentSlide.audioBase64)) && currentSlide.layout !== 'text-only' && (
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2 text-orange-400">
                             <AlertTriangle className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Chybějící obsah</span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">Některé části tohoto slajdu (obrázek nebo zvuk) se nepodařilo vygenerovat.</p>
                          <div className="flex gap-2">
                            <button 
                               onClick={() => handleRegenerateImage(currentIndex)}
                               disabled={isUpdating}
                               className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-950/20"
                            >
                               {isUpdating ? <Loader2 className="animate-spin w-3 h-3"/> : <ImageIcon className="w-3 h-3"/>} Obrázek
                            </button>
                            <button 
                               onClick={() => onRegenerateAudio && onRegenerateAudio(currentIndex)}
                               disabled={isUpdating}
                               className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                            >
                               {isUpdating ? <Loader2 className="animate-spin w-3 h-3"/> : <Volume2 className="w-3 h-3"/>} Zvuk
                            </button>
                          </div>
                      </div>
                  )}

                  <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Co chceš změnit?</label>
                      <textarea 
                        value={aiUpdatePrompt}
                        onChange={(e) => setAiUpdatePrompt(e.target.value)}
                        placeholder="Změň obrázek na futuristický..."
                        className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none transition-all"
                      />
                      <button 
                        onClick={handleUpdateSlideAI} 
                        disabled={isUpdating || !aiUpdatePrompt}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      >
                          {isUpdating ? <Loader2 className="animate-spin w-3 h-3"/> : <Sparkles className="w-3 h-3"/>} Upravit přes AI
                      </button>
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-6">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obrázek a vizuály</label>
                      <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleRegenerateImage(currentIndex)} disabled={isUpdating} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900 transition-all">
                              <RefreshCw className={`w-5 h-5 text-indigo-400 ${isUpdating ? 'animate-spin' : ''}`}/>
                              <span className="text-[9px] font-bold text-slate-400">Regenerovat</span>
                          </button>
                          
                          <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900 transition-all cursor-pointer">
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                              <Upload className="w-5 h-5 text-emerald-400"/>
                              <span className="text-[9px] font-bold text-slate-400">Vlastní fotka</span>
                          </label>
                      </div>
                      <button 
                         onClick={() => onRegenerateAudio && onRegenerateAudio(currentIndex)} 
                         disabled={isUpdating}
                         className="w-full py-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                      >
                          <Volume2 className="w-4 h-4 text-sky-400"/>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Regenerovat Zvuk</span>
                      </button>
                  </div>

                  {currentSlide.imageValidation && (
                      <div className={`p-4 rounded-2xl border ${currentSlide.imageValidation.isOk ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                          <h5 className={`text-[10px] font-black uppercase mb-1 ${currentSlide.imageValidation.isOk ? 'text-emerald-400' : 'text-red-400'}`}>Výsledek kontroly:</h5>
                          <p className="text-slate-400 text-xs italic">"{currentSlide.imageValidation.reason}"</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Ovládání - Top (Smaller) */}
      <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-start pointer-events-none">
         <div className="pointer-events-auto flex gap-2">
            <button onClick={onReset} className="w-10 h-10 rounded-xl bg-slate-900/60 backdrop-blur-xl flex items-center justify-center text-slate-400 border border-white/5 shadow-xl hover:text-white transition-all" title="Zavřít k dashboardu"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setIsEditing(!isEditing)} className={`w-10 h-10 rounded-xl bg-slate-900/60 backdrop-blur-xl flex items-center justify-center border border-white/5 shadow-xl transition-all ${isEditing ? 'text-blue-400 border-blue-500/50' : 'text-slate-400 hover:text-white'}`} title="Upravit slide"><Wand2 className="w-4 h-4" /></button>
            <button 
                onClick={() => setIsShareDialogOpen(true)}
                className={`w-10 h-10 rounded-xl bg-slate-900/60 backdrop-blur-xl flex items-center justify-center border border-white/5 shadow-xl transition-all ${data.isPublic ? 'text-emerald-400 border-emerald-500/50' : 'text-slate-400 hover:text-white'}`} 
                title="Sdílet odkaz"
            >
                <Share2 className="w-4 h-4" />
            </button>
            <button 
                onClick={() => {
                    if (window.confirm('Opravdu chceš celou tuto prezentaci smazat?')) {
                        if (data.id) onDelete(data.id);
                        onReset();
                    }
                }}
                className="w-10 h-10 rounded-xl bg-slate-900/60 backdrop-blur-xl flex items-center justify-center text-slate-500 border border-white/5 shadow-xl hover:text-red-500 transition-all"
                title="Smazat prezentaci"
            >
                <Trash2 className="w-4 h-4" />
            </button>
         </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2 w-1/2">
            <input type="text" value={editableTitle} onChange={(e) => setEditableTitle(e.target.value)} className="text-lg font-black text-white text-right bg-transparent border-none focus:outline-none w-full tracking-tight" />
            <button onClick={() => setIsExportDialogOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center shadow-lg transition-all group overflow-hidden">
                <MonitorPlay className="w-3 h-3 mr-2 group-hover:animate-pulse" /> 
                Odevzdat praci
            </button>
        </div>
      </div>

      {/* Share Dialog */}
      {isShareDialogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
              <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8">
                  <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-2">
                         <Share2 className="w-5 h-5 text-blue-400" />
                         <h3 className="text-white font-black text-xl tracking-tight">Sdílení Mise</h3>
                      </div>
                      <button onClick={() => setIsShareDialogOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>

                  <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-3">
                             <Globe className={`w-5 h-5 ${data.isPublic ? 'text-emerald-400' : 'text-slate-500'}`} />
                             <div>
                                <p className="text-white text-sm font-bold">Veřejná viditelnost</p>
                                <p className="text-[10px] text-slate-500 font-medium">Bude vidět v sekci Prozkoumat</p>
                             </div>
                          </div>
                          <button 
                            onClick={handleTogglePublic}
                            className={`w-10 h-5 rounded-full relative transition-all ${data.isPublic ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          >
                             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${data.isPublic ? 'left-6' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Unikátní odkaz pro zobrazení</label>
                          <div className="flex gap-2">
                              <div className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-slate-400 font-mono truncate">
                                  {shareUrl}
                              </div>
                              <button 
                                onClick={copyLink}
                                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                              >
                                  <LinkIcon className="w-4 h-4" />
                              </button>
                          </div>
                      </div>

                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
                         <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                         <p className="text-slate-400 text-[10px] leading-relaxed">Tento odkaz umožní komukoliv prohlížet tvou prezentaci v interaktivním režimu jen pro čtení.</p>
                      </div>

                      <button 
                        onClick={() => setIsShareDialogOpen(false)}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        Hotovo
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Export Dialog */}
      {isExportDialogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
              <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex border-b border-white/5">
                      <button onClick={() => setExportTab('files')} className={`flex-1 py-4 font-black text-[10px] tracking-widest uppercase transition-all ${exportTab === 'files' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500'}`}>Soubory ke stažení</button>
                      <button onClick={() => setExportTab('guide')} className={`flex-1 py-4 font-black text-[10px] tracking-widest uppercase transition-all ${exportTab === 'guide' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500'}`}>Jak odevzdat</button>
                      <button onClick={() => setIsExportDialogOpen(false)} className="px-5 text-slate-600 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>

                  {exportTab === 'files' ? (
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <ExportFileCard title="PowerPoint" desc="PPTX soubor do Teams." icon={<Layout className="text-orange-500 w-4 h-4"/>} onClick={() => generatePPTX(data)} accent="orange"/>
                          <ExportFileCard title="Fotky" desc="Slajdy jako PNG obrázky." icon={<ImageIcon className="text-emerald-500 w-4 h-4"/>} onClick={handleDownloadImages} accent="emerald"/>
                          <ExportFileCard title="PDF" desc="Klasický náhled." icon={<Printer className="text-red-500 w-4 h-4"/>} onClick={() => window.print()} accent="red"/>
                          <ExportFileCard title="Web (.html)" desc="Interaktivní prezentace." icon={<MonitorPlay className="text-blue-500 w-4 h-4"/>} onClick={() => {}} accent="blue"/>
                      </div>
                  ) : (
                      <div className="p-8 space-y-4">
                          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 flex gap-4">
                              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                              <p className="text-slate-400 text-xs leading-relaxed">Nahraj PPTX do "Soubory" v Teams. Pro animace pošli i HTML soubor.</p>
                          </div>
                      </div>
                  )}
                  <div className="p-8 pt-0 flex justify-end">
                      <button onClick={() => setIsExportDialogOpen(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors">Zavřít</button>
                  </div>
              </div>
          </div>
      )}

      {/* Ovládání - Bottom-Right (Smaller) */}
      <div className="absolute bottom-8 right-64 flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl border border-white/5 p-1.5 rounded-2xl shadow-2xl z-50">
        <button onClick={prevSlide} disabled={currentIndex === 0} className="p-2 text-white disabled:opacity-20 hover:bg-white/5 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
        <div className="px-3 text-white font-black text-sm min-w-16 text-center">{currentIndex + 1} / {totalPages}</div>
        <button onClick={nextSlide} disabled={currentIndex === totalPages - 1} className="p-2 text-white disabled:opacity-20 hover:bg-white/5 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
        
        {(currentSlide?.audioUrl || currentSlide?.audioBase64) && (
            <div className="h-6 w-px bg-white/10 mx-1" />
        )}
        
        {(currentSlide?.audioUrl || currentSlide?.audioBase64) && (
            <button onClick={toggleAudio} className={`p-2 rounded-xl transition-all ${isPlaying ? 'bg-blue-500 text-white active:scale-95' : 'text-slate-400 hover:text-white'}`}>
                {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
        )}
      </div>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};

const ExportFileCard = ({ title, desc, icon, onClick, accent }: any) => (
    <button onClick={onClick} className="bg-slate-950 p-5 rounded-3xl border border-white/5 flex flex-col text-left group hover:border-white/10 transition-all">
        <div className="flex items-center gap-4 mb-3">
            <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
            <h4 className="font-bold text-white text-sm">{title}</h4>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">{desc}</p>
    </button>
);
