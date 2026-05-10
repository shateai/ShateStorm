
import React from 'react';
import { motion, Reorder } from 'motion/react';
import { Trash2, GripVertical, Plus, Sparkles, Wand2, X, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { DraftSlide } from '../types';

interface OutlineViewerProps {
  topic: string;
  outline: DraftSlide[];
  onUpdate: (o: DraftSlide[]) => void;
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
  const addSlide = () => {
    const newSlide: DraftSlide = {
      title: "Nový Slajd",
      description: "Popis cíle slajdu",
      suggestedBullets: ["Nová odrážka 1", "Nová odrážka 2"]
    };
    onUpdate([...outline, newSlide]);
    setSlideCount(outline.length + 1);
  };

  const removeSlide = (index: number) => {
    const newOutline = [...outline];
    newOutline.splice(index, 1);
    onUpdate(newOutline);
    setSlideCount(newOutline.length);
  };

  const updateSlide = (index: number, field: keyof DraftSlide, value: any) => {
    const newOutline = [...outline];
    newOutline[index] = { ...newOutline[index], [field]: value };
    onUpdate(newOutline);
  };

  return (
    <div className="container mx-auto px-6 pt-32 pb-20 max-w-5xl">
       <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-white/5 pb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-0.5 w-12 bg-purple-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Strategické Plánování</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">Architektura <span className="text-slate-500">Obsahu</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
              <button 
                onClick={onCancel}
                className="px-8 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                disabled={isRegenerating}
              >
                Storno
              </button>
              <button 
                onClick={onRegenerate}
                className="flex items-center gap-3 px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/10 transition-all"
                disabled={isRegenerating}
              >
                {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Přebudovat Osnovu
              </button>
          </div>
       </div>

       <div className="mb-12 bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                <Sparkles className="w-6 h-6 text-blue-400" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hlavní Téma</p>
                <p className="text-xl font-black text-white">{topic}</p>
             </div>
          </div>
          
          <div className="h-12 w-px bg-white/5 hidden md:block"></div>
          
          <div className="flex items-center gap-12">
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Počet Segmentů</p>
                <p className="text-2xl font-black text-blue-400">{outline.length}</p>
             </div>
             
             <button
               onClick={onGenerate}
               disabled={isRegenerating || outline.length === 0}
               className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center gap-4 group"
             >
                Finalizovat Misi
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
             </button>
          </div>
       </div>

       <Reorder.Group axis="y" values={outline} onReorder={onUpdate} className="space-y-6">
          {outline.map((slide, index) => (
            <Reorder.Item 
                key={index} 
                value={slide}
                className="group glass-card border-none bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-10 flex gap-8 items-start relative hover:bg-white/[0.03] transition-all"
            >
                <div className="flex flex-col items-center gap-4 pt-2">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs text-slate-500 border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                        {index + 1}
                    </div>
                    <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-400 p-2">
                        <GripVertical className="w-5 h-5" />
                    </div>
                </div>

                <div className="flex-grow space-y-6">
                    <input 
                        type="text" 
                        value={slide.title}
                        onChange={(e) => updateSlide(index, 'title', e.target.value)}
                        className="w-full bg-transparent text-2xl font-black text-white focus:outline-none focus:text-blue-400 transition-colors tracking-tight"
                        placeholder="Název slajdu..."
                    />
                    
                    <textarea 
                        value={slide.description}
                        onChange={(e) => updateSlide(index, 'description', e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-sm text-slate-400 focus:outline-none focus:border-white/10 transition-all resize-none italic"
                        rows={2}
                        placeholder="Co je cílem tohoto slajdu?"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slide.suggestedBullets.map((bullet, bi) => (
                            <div key={bi} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 group/bullet">
                                <div className="w-1.5 h-1.5 bg-blue-500/40 rounded-full"></div>
                                <input 
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => {
                                        const newBullets = [...slide.suggestedBullets];
                                        newBullets[bi] = e.target.value;
                                        updateSlide(index, 'suggestedBullets', newBullets);
                                    }}
                                    className="bg-transparent text-xs font-bold text-slate-300 w-full focus:outline-none"
                                />
                                <button 
                                    onClick={() => {
                                        const newBullets = [...slide.suggestedBullets];
                                        newBullets.splice(bi, 1);
                                        updateSlide(index, 'suggestedBullets', newBullets);
                                    }}
                                    className="opacity-0 group-hover/bullet:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={() => {
                                updateSlide(index, 'suggestedBullets', [...slide.suggestedBullets, "Nová odrážka"]);
                            }}
                            className="flex items-center gap-2 px-4 py-3 border border-dashed border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 hover:border-white/10 transition-all"
                        >
                            <Plus className="w-3 h-3" />
                            Přidat Odrážku
                        </button>
                    </div>
                </div>

                <button 
                    onClick={() => removeSlide(index)}
                    className="p-3 text-slate-700 hover:text-red-500 bg-white/[0.02] hover:bg-red-500/10 rounded-xl transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </Reorder.Item>
          ))}
       </Reorder.Group>

       <button 
          onClick={addSlide}
          className="w-full mt-12 py-10 border-4 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-blue-500 hover:border-blue-500/20 hover:bg-blue-500/5 transition-all group"
       >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
             <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Injektovat Nový Segment</span>
       </button>
    </div>
  );
};
