
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Sparkles, Mic, Play, Square, Eye, Layout, Clipboard, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
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
      if (file.type.startsWith('image/') && !filePreviews[file.name + file.size]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => ({ ...prev, [file.name + file.size]: reader.result as string }));
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
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Nová mise</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Zadejte téma nebo vložte poznámky</label>
                <div className="flex items-center gap-1.5 text-blue-400/60 text-[8px] font-bold uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded-full border border-blue-500/10">
                  <Clipboard className="w-2.5 h-2.5" /> Ctrl+V vloží obrázek
                </div>
              </div>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onPaste={handlePaste}
                placeholder="Popište svou vizi, vložte text z přednášky nebo webu..."
                className="w-full h-48 bg-slate-950/50 border border-white/5 rounded-2xl p-6 text-white text-base leading-relaxed focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 resize-none shadow-inner"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Délka mise (Počet slajdů)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={slideCount}
                    onChange={(e) => setSlideCount(parseInt(e.target.value) || 1)}
                    className="w-12 h-7 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center text-[10px] font-bold text-blue-400 focus:outline-none focus:border-blue-500/50"
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">slajdů</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSlideCount(count)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      slideCount === count 
                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20' 
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Přílohy a podklady</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-3 w-full h-14 bg-white/5 border border-white/10 border-dashed rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-white/10 transition-all group px-4"
                  >
                    <Upload className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-bold uppercase tracking-widest">Nahrát soubory</span>
                  </label>
                </div>

                <div className="flex items-center justify-center px-4 bg-blue-500/5 border border-blue-500/10 rounded-xl h-14">
                  <p className="text-[9px] text-slate-500 text-center leading-tight">
                    Můžeš nahrát <span className="text-blue-400 font-bold">PDF</span> nebo <span className="text-blue-400 font-bold">Obrázky</span>.
                  </p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-950/50 rounded-2xl border border-white/5">
                {files.map((file, index) => {
                  const preview = filePreviews[file.name + file.size];
                  return (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group w-14 h-14 bg-slate-800 rounded-xl overflow-hidden border border-white/5"
                    >
                      {preview ? (
                        <img src={preview} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="preview" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-600" />
                        </div>
                      )}
                      <button 
                        onClick={() => {
                            const newFiles = files.filter((_, i) => i !== index);
                            setFiles(newFiles);
                        }} 
                        className="absolute -top-1 -right-1 w-5 h-5 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 z-10 scale-75"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={onGenerate}
                disabled={!topic || isGenerating}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl relative overflow-hidden group tracking-widest uppercase
                  ${!topic || isGenerating 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.01] active:scale-95 shadow-blue-500/20'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provádím průzkum...</span>
                  </>
                ) : (
                  <>
                    <span>Pokračovat k osnově</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
