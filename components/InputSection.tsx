
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Sparkles, Mic, Play, Square, Eye, Layout, Clipboard, Loader2, ArrowRight, Trash2, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { previewVoice } from '../services/geminiService';

interface InputSectionProps {
  topic: string;
  setTopic: (t: string) => void;
  slideCount: number;
  setSlideCount: (c: number) => void;
  voice: string;
  setVoice: (v: string) => void;
  files: File[];
  setFiles: (f: File[]) => void;
  onGenerate: () => void;
  onShowDemo: () => void;
  isGenerating: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  topic, setTopic, slideCount, setSlideCount, voice, setVoice, files, setFiles, onGenerate, onShowDemo, isGenerating
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voices = [
    { id: 'Kore', label: 'Kore (Mužský)', desc: 'Hluboký, autoritativní' },
    { id: 'Fenris', label: 'Fenris (Mužský)', desc: 'Mladý, energický' },
    { id: 'Aoede', label: 'Aoede (Ženský)', desc: 'Jemný, uklidňující' },
    { id: 'Charon', label: 'Charon (Neutrální)', desc: 'Robotický, technický' }
  ];

  const handleFile = (newFiles: FileList | null) => {
    if (newFiles) {
      setFiles([...files, ...Array.from(newFiles)]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handlePreviewVoice = async () => {
      setIsPreviewing(true);
      const audio = await previewVoice(voice);
      if (audio) {
          const snd = new Audio(`data:audio/wav;base64,${audio}`);
          snd.play();
          snd.onended = () => setIsPreviewing(false);
      } else {
          setIsPreviewing(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pt-20">
      {/* Visual Header */}
      <div className="text-center mb-16">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 mb-8"
        >
          <Sparkles className="w-10 h-10 text-blue-400" />
        </motion.div>
        <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Vdechněte život svým <span className="text-blue-500">myšlenkám</span></h2>
        <p className="text-slate-500 font-medium text-lg">Zadejte téma nebo nahrajte podklady. SHATE se postará o zbytek.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main input column */}
        <div className="md:col-span-8 space-y-8">
          <div className="glass-card rounded-[2.5rem] p-10 border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Jádro Problému</h3>
            </div>
            
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="O čem to bude? Např.: 'Historie dobývání Marsu' nebo 'Jak funguje termonukleární fúze'..."
              className="w-full h-48 bg-white/[0.03] border border-white/5 rounded-3xl p-8 text-lg font-medium focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-700 resize-none"
            />

            <div className="mt-10">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Přídavné moduly (Soubory)</h3>
               </div>
               
               <div 
                 onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                 onDragLeave={() => setDragActive(false)}
                 onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files); }}
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                   dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                 }`}
               >
                 <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => handleFile(e.target.files)} />
                 <Upload className="w-10 h-10 text-slate-600 mx-auto mb-6" />
                 <p className="text-slate-400 font-bold mb-2">Přetáhněte sem data (PDF, TXT, DOCX)</p>
                 <p className="text-slate-600 text-xs font-medium uppercase tracking-widest">Nebo klikněte pro nahrání</p>
               </div>

               <AnimatePresence>
                 {files.length > 0 && (
                   <div className="mt-6 flex flex-wrap gap-3">
                     {files.map((f, i) => (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         key={i} 
                         className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 group"
                       >
                         <FileText className="w-4 h-4 text-blue-400" />
                         <span className="text-xs font-bold text-blue-300">{f.name}</span>
                         <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-slate-500 hover:text-red-400 transition-colors">
                           <X className="w-4 h-4" />
                         </button>
                       </motion.div>
                     ))}
                   </div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar settings column */}
        <div className="md:col-span-4 space-y-8">
          <div className="glass-card rounded-[2.5rem] p-10 border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Parametry Mise</h3>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4 block">Rozsah (Počet Slajdů)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[3, 5, 8, 10, 15].map(c => (
                    <button
                      key={c}
                      onClick={() => setSlideCount(c)}
                      className={`py-3 rounded-xl font-black text-xs transition-all ${
                        slideCount === c ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.08]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4 block">Hlasový Modul (AI Vypravěč)</label>
                <div className="space-y-3">
                  {voices.map(v => (
                    <div 
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                        voice === v.id ? 'bg-blue-600/10 border-blue-500/40' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-black uppercase tracking-widest ${voice === v.id ? 'text-blue-400' : 'text-slate-400'}`}>{v.label}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{v.desc}</p>
                      </div>
                      {voice === v.id && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePreviewVoice(); }}
                          disabled={isPreviewing}
                          className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg animate-in zoom-in"
                        >
                          {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Iniciuji...
              </>
            ) : (
              <>
                Spustit Generátor
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
          
          <button 
            onClick={onShowDemo}
            className="w-full py-4 text-slate-600 hover:text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] transition-colors"
          >
            Spustit Diagnostickou Ukázku
          </button>
        </div>
      </div>
    </div>
  );
};
