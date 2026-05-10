
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
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `vlozeny_obrazek_${Date.now()}_${i}.png`, { type: blob.type });
          pastedFiles.push(file);
        }
      }
    }
    
    if (pastedFiles.length > 0) {
      setFiles([...files, ...pastedFiles]);
    }
  };

  useEffect(() => {
    files.forEach(file => {
      const key = file.name + file.size;
      if (file.type.startsWith('image/') && !filePreviews[key]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => ({ ...prev, [key]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    });
  }, [files]);

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    const key = fileToRemove.name + fileToRemove.size;
    const newPreviews = { ...filePreviews };
    delete newPreviews[key];
    setFilePreviews(newPreviews);
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 relative z-10 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Operační Jádro</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-none">
          Zahájit Novou <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Misi</span>
        </h2>
        <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
          Zadejte téma, vložte poznámky nebo nahrajte podklady pro vaši příští vizuální cestu.
        </p>
      </motion.div>

      <div className={`relative glass-card border-none bg-[#0a0f1e] rounded-[3rem] p-4 transition-all duration-700 shadow-[0_32px_100px_rgba(0,0,0,0.6)] ${isFocused ? 'ring-2 ring-blue-500/30' : ''}`}>
        <div className="relative">
          <textarea
            value={topic}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(topic.length > 0)}
            onChange={(e) => setTopic(e.target.value)}
            onPaste={handlePaste}
            placeholder="Např.: Historie dobývání vesmíru, Kvantová informatika pro začátečníky..."
            className="w-full bg-transparent p-10 text-xl text-white placeholder:text-slate-800 focus:outline-none min-h-[220px] resize-none border-b border-white/5 font-medium leading-relaxed"
          />
          
          <AnimatePresence>
            {files.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 flex flex-wrap gap-4"
                >
                    {files.map((file, i) => {
                         const preview = filePreviews[file.name + file.size];
                         return (
                            <div key={i} className="group relative w-32 h-20 bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all">
                                {preview ? (
                                    <img src={preview} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-4">
                                        <FileText className="w-6 h-6 text-slate-600" />
                                        <span className="text-[8px] font-black uppercase text-slate-500 ml-2 truncate">{file.name}</span>
                                    </div>
                                )}
                                <button 
                                    onClick={() => removeFile(i)}
                                    className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                >
                                    <Trash2 className="w-5 h-5 text-white" />
                                </button>
                            </div>
                         );
                    })}
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col md:flex-row p-6 items-center gap-8 bg-slate-950/40 rounded-b-[2.5rem]">
          <div className="flex flex-wrap items-center gap-6 flex-grow">
            {/* Number of slides */}
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                <Layout className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-0.5">Délka: </span>
                <input 
                    type="number" 
                    min="3" 
                    max="30" 
                    value={slideCount} 
                    onChange={(e) => setSlideCount(parseInt(e.target.value) || 1)}
                    className="w-10 bg-transparent text-white font-black text-lg focus:outline-none"
                />
            </div>

            {/* Voice select */}
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                <Mic className="w-4 h-4 text-indigo-400" />
                <select 
                    value={voice} 
                    onChange={(e) => setVoice(e.target.value)}
                    className="bg-transparent text-white font-black text-[10px] uppercase tracking-widest focus:outline-none appearance-none cursor-pointer pr-4"
                >
                    <option className="bg-slate-900" value="Profi">Profi Hlas</option>
                    <option className="bg-slate-900" value="Relax">Relaxační</option>
                    <option className="bg-slate-900" value="Edu">Vzdělávací</option>
                </select>
            </div>

            <label className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all group flex items-center gap-3">
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Nahrát</span>
            </label>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating || !topic.trim()}
            className="group px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4 disabled:bg-slate-900 disabled:text-slate-700 shadow-2xl transition-all active:scale-95 shadow-blue-500/20"
          >
            {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Výpočet...
                </>
            ) : (
                <>
                  <Rocket className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
                  Iniciovat
                </>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-16 flex justify-center gap-12 items-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-800">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></div>
            Generování Osnovy
         </div>
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40"></div>
            Vizuální Syntéza
         </div>
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
            Audio Doprovod
         </div>
      </div>
    </div>
  );
};
