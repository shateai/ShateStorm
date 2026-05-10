
import React from 'react';
import { Presentation } from '../types';
import { Layout, Clock, Play, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface GalleryProps {
  presentations: Presentation[];
  onBack: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ presentations, onBack }) => {
  const completed = presentations.filter(p => p.status === 'complete');

  return (
    <div className="min-h-screen bg-[#030712] pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-16 border-b border-white/5 pb-12">
          <div className="flex items-center gap-8">
             <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
             </button>
             <h1 className="text-4xl font-black text-white tracking-widest uppercase">Galerie Výsledků</h1>
          </div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-6 py-2 rounded-full">
             {completed.length} Kompletních Misí
          </div>
        </div>

        {completed.length === 0 ? (
          <div className="text-center py-40 glass-card bg-white/[0.02] border-none">
             <p className="text-slate-500 font-bold">Zatím jste nedokončili žádnou prezentaci.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {completed.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-[2rem] overflow-hidden border-none bg-slate-900/40 hover:bg-white/[0.05] transition-all group"
              >
                 <div className="aspect-video bg-slate-800 relative overflow-hidden">
                    {p.slides[0]?.imageUrl ? (
                        <img src={p.slides[0].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.presentationTitle} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Layout className="w-12 h-12 text-slate-700" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            <Play className="w-6 h-6 fill-current" />
                        </div>
                    </div>
                 </div>
                 <div className="p-8">
                    <h3 className="text-xl font-black text-white mb-2 line-clamp-1">{p.presentationTitle}</h3>
                    <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(p.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
