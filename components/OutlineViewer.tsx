
import React from 'react';
import { motion } from 'motion/react';
import { Check, Edit3, Trash2, Plus, Sparkles, ArrowRight, Minus, RefreshCw, Loader2 } from 'lucide-react';
import { DraftSlide } from '../types';

interface OutlineViewerProps {
  topic: string;
  outline: DraftSlide[];
  onUpdate: (outline: DraftSlide[]) => void;
  onGenerate: () => void;
  onCancel: () => void;
  slideCount: number;
  setSlideCount: (c: number) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const OutlineViewer: React.FC<OutlineViewerProps> = ({ 
  topic, outline, onUpdate, onGenerate, onCancel, slideCount, setSlideCount, onRegenerate, isRegenerating 
}) => {
  
  const handleEditTitle = (index: number, title: string) => {
    const newOutline = [...outline];
    newOutline[index].title = title;
    onUpdate(newOutline);
  };

  const handleEditBullet = (slideIndex: number, bulletIndex: number, text: string) => {
    const newOutline = [...outline];
    newOutline[slideIndex].suggestedBullets[bulletIndex] = text;
    onUpdate(newOutline);
  };

  const handleAddBullet = (index: number) => {
    const newOutline = [...outline];
    newOutline[index].suggestedBullets.push("Nový bod...");
    onUpdate(newOutline);
  };

  const handleRemoveSlide = (index: number) => {
    const newOutline = outline.filter((_, i) => i !== index);
    onUpdate(newOutline);
  };

  const handleAddSlide = () => {
    onUpdate([...outline, { title: "Nový Slide", description: "Popis nového slidu", suggestedBullets: ["Bod 1"] }]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" /> AI Průzkum Dokončen
        </div>
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Navrhovaná osnova</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-6 text-sm">Prověř téma "<span className="text-white font-bold">{topic}</span>" a uprav rozsah nebo jednotlivé body.</p>
        
        <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-slate-950/40 backdrop-blur-3xl shadow-2xl border border-white/5 rounded-2xl p-4 px-8 mb-4">
            <div className="flex flex-col items-start gap-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Počet slajdů</span>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSlideCount(Math.max(3, slideCount - 1))}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-2xl font-black text-white w-12 text-center">{slideCount}</span>
                    <button 
                        onClick={() => setSlideCount(Math.min(20, slideCount + 1))}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="w-px h-12 bg-white/5"></div>
            <button 
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-600/20 transition-all disabled:opacity-50"
            >
                {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Přegenerovat
            </button>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        {outline.map((slide, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative flex gap-4 bg-slate-900/60 border border-white/5 rounded-2xl p-6 hover:border-blue-500/20 transition-all"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-500/10 shadow-lg">
                {idx + 1}
            </div>
            
            <div className="flex-grow space-y-3">
                <input 
                  value={slide.title}
                  onChange={(e) => handleEditTitle(idx, e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-lg focus:outline-none focus:text-blue-400 transition-colors"
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {slide.suggestedBullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5 border border-white/5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                            <input 
                              value={bullet}
                              onChange={(e) => handleEditBullet(idx, bIdx, e.target.value)}
                              className="w-full bg-transparent text-slate-400 text-xs focus:outline-none focus:text-white transition-colors"
                            />
                        </div>
                    ))}
                    <button 
                      onClick={() => handleAddBullet(idx)}
                      className="flex items-center justify-center gap-2 border border-dashed border-white/5 rounded-xl p-2 text-slate-600 hover:border-blue-500/20 hover:text-blue-400 transition-all text-xs"
                    >
                      <Plus className="w-3 h-3" /> Přidat bod
                    </button>
                </div>
            </div>

            <button 
              onClick={() => handleRemoveSlide(idx)}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all self-start mt-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}

        <button 
          onClick={handleAddSlide}
          className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-slate-600 hover:text-blue-400 hover:border-blue-500/20 hover:bg-blue-500/5 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Přidat slide
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 px-6 border border-white/5 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-widest"
        >
          Zpět
        </button>
        <button 
          onClick={onGenerate}
          className="flex-[2] py-4 px-6 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-white/5"
        >
          Potvrdit a generovat <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
