
import React, { useEffect, useState } from 'react';
import { Presentation } from '../types';
import { getPublicPresentations } from '../services/firebaseService';
import { motion } from 'motion/react';
import { Compass, Calendar, User, ArrowRight, Loader2, Search } from 'lucide-react';

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inspirace z flotily</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Prozkoumat Výzkum</h1>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text"
            placeholder="Hledat mise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Skenuji veřejné archivy...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 bg-white/[0.02] border border-white/5 rounded-[2rem]">
          <p className="text-slate-500 font-bold">Zatím nebyly publikovány žádné mise odpovídající hledání.</p>
        </div>
      ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filtered.map((p, idx) => {
        const firstSlide = p.slides?.[0];
        const previewUrl = firstSlide?.imageUrl || firstSlide?.imageBase64;

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => onSelect(p)}
            className="group relative flex flex-col bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-blue-500/40 transition-all duration-500 cursor-pointer"
          >
            {/* Image Preview Container */}
            <div className="relative h-56 overflow-hidden bg-slate-800">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt={p.presentationTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <Compass className="w-12 h-12 text-slate-700 group-hover:rotate-12 transition-transform duration-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
              
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{p.slides?.length || 0} Slajdů</span>
                </div>
              </div>
            </div>
            
            {/* Content info */}
            <div className="p-8 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                  {p.presentationTitle}
              </h3>
              <p className="text-slate-500 text-sm mb-8 line-clamp-2 leading-relaxed">
                  {p.topic}
              </p>

              <div className="mt-auto flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                       <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Průzkumník</span>
                      <span className="text-[9px] text-slate-500 font-medium">Veřejná mise</span>
                    </div>
                 </div>
                 
                 <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
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
  );
};
