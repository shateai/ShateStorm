
import React, { useState, useEffect } from 'react';
import { Presentation } from '../types';
import { getPublicPresentations } from '../services/firebaseService';
import { motion } from 'motion/react';
import { Compass, Calendar, User, ArrowRight, Loader2, Search, X } from 'lucide-react';

interface ExploreProps {
  onSelect: (p: Presentation) => void;
  onBack: () => void;
}

export const Explore: React.FC<ExploreProps> = ({ onSelect, onBack }) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getPublicPresentations().then(ps => {
      setPresentations(ps);
      setLoading(false);
    });
  }, []);

  const filtered = presentations.filter(p => 
    p.presentationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-white/5 pb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-0.5 w-12 bg-blue-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Archiv Veřejných Misí</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">Prozkoumat <span className="text-slate-500">Sektor</span></h1>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Hledat v databázi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                 <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-8" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Skenování vizuálních dat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-40 glass-card border-none bg-white/[0.02] rounded-[3rem]">
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">V tomto sektoru nebyly nalezeny žádné odpovídající mise</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((p, idx) => {
              const firstSlide = p.slides?.[0];
              const previewUrl = firstSlide?.imageUrl || (firstSlide?.imageBase64 ? `data:image/png;base64,${firstSlide.imageBase64}` : null);

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelect(p)}
                  className="group relative flex flex-col glass-card border-none bg-[#0a0f1e] overflow-hidden hover:bg-white/[0.02] transition-all duration-500 cursor-pointer h-full rounded-[2.5rem]"
                >
                  <div className="relative h-72 overflow-hidden bg-slate-900">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
                        alt={p.presentationTitle}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                         <Compass className="w-12 h-12 text-slate-800" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-60"></div>
                    
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">{p.slides?.length || 0} Slajdů</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-10 flex flex-col flex-grow">
                    <h3 className="text-2xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors line-clamp-2 leading-[1.1] tracking-tight">
                        {p.presentationTitle}
                    </h3>
                    
                    <p className="text-slate-500 text-sm line-clamp-2 mb-8 leading-relaxed">
                        {p.topic}
                    </p>

                    <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Autor</span>
                        <div className="flex items-center gap-2">
                           <User className="w-3 h-3 text-slate-500" />
                           <span className="text-[10px] font-bold text-slate-400">Agent SHATE</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all text-slate-500">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
