
import React, { useEffect, useState } from 'react';
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
    const fetchPublic = async () => {
      setLoading(true);
      try {
        const publicPresentations = await getPublicPresentations();
        setPresentations(publicPresentations);
      } catch (e) {
        console.error("Failed to fetch explore content", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, []);

  const filtered = presentations.filter(p => 
    p.presentationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none animate-fluid"></div>
      
      <div className="container mx-auto px-6 pt-32 pb-20 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-start gap-12 mb-20 border-b border-white/5 pb-16">
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-transparent"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400">Veřejný Archiv</span>
            </motion.div>
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
              Prozkoumat <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Galerii</span>
            </h1>
            <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed">
              Inspirujte se nejlepšími vzdělávacími misemi vytvořenými naší komunitou.
            </p>
          </div>

          <div className="relative group w-full md:min-w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              placeholder="Slovní sféry, kvantová fyzika, dějepis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 shadow-2xl"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                 <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <Compass className="absolute inset-0 m-auto w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Skenování vizuálních dat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-40 glass-card border-none bg-white/[0.02] rounded-[3rem]">
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">V tomto sektoru nebyly nalezeny žádné odpovídající mise</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filtered.map((p, idx) => {
              const firstSlide = p.slides?.[0];
              const previewUrl = firstSlide?.imageUrl || (firstSlide?.imageBase64 ? `data:image/png;base64,${firstSlide.imageBase64}` : null);

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelect(p)}
                  className="group relative flex flex-col glass-card border-none bg-[#0a0f1e] overflow-hidden hover:bg-white/[0.02] transition-all duration-500 cursor-pointer h-full rounded-[2.5rem]"
                >
                  <div className="relative h-72 overflow-hidden bg-slate-900">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt={p.presentationTitle}
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-[#030712]">
                        <Compass className="w-16 h-16 text-white/5 opacity-20 group-hover:rotate-12 transition-all duration-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-80"></div>
                    
                    <div className="absolute top-6 left-6">
                      <div className="bg-slate-950/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{p.slides?.length || 0} Slajdů</span>
                      </div>
                    </div>

                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                       <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-900/40">
                          <ArrowRight className="w-5 h-5" />
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-10 flex flex-col flex-grow">
                    <h3 className="text-2xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors line-clamp-2 leading-[1.1] tracking-tight">
                        {p.presentationTitle}
                    </h3>
                    <p className="text-slate-500 text-sm mb-10 line-clamp-2 leading-relaxed font-medium">
                        {p.topic}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center shadow-lg group-hover:border-blue-500/30 transition-colors">
                             <User className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Archivář</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Veřejná instance</span>
                          </div>
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
