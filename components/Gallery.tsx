
import React from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Download, ExternalLink, ArrowLeft } from 'lucide-react';
import { Presentation } from '../types';

interface GalleryProps {
  presentations: Presentation[];
  onBack: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ presentations, onBack }) => {
  // Extract all unique images
  const allImages = presentations.flatMap(p => 
    (p.slides || [])
      .filter(s => s.imageUrl || s.imageBase64)
      .map(s => ({
        url: s.imageUrl || `data:image/png;base64,${s.imageBase64}`,
        title: s.title,
        presentationTitle: p.presentationTitle,
        presentationId: p.id
      }))
  );

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none animate-fluid"></div>

      <div className="container mx-auto px-6 pt-32 pb-20 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-start gap-12 mb-20 border-b border-white/5 pb-16">
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-transparent"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400">Vizuální Paměť</span>
            </motion.div>
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
              Moje <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-600">Galerie</span>
            </h1>
            <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed">
              Všechny vizuály generované pro vaše mise na jednom místě.
            </p>
          </div>

          <button 
            onClick={onBack}
            className="group flex items-center gap-4 px-10 py-5 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition-all text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-2xl text-white"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
            Návrat k Misím
          </button>
        </div>

        {allImages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-48 glass-card border-none bg-white/[0.02] rounded-[3rem]"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
               <ImageIcon className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Vizuální archiv je prázdný</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {allImages.map((img, idx) => (
              <motion.div 
                key={`${img.url}-${idx}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group relative aspect-[4/5] glass-card border-none bg-slate-900 overflow-hidden hover:bg-white/[0.05] transition-all duration-500 rounded-[2.5rem]"
              >
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Meta info on hover */}
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-8 group-hover:translate-y-0">
                   <div className="flex flex-col gap-1 mb-6">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{img.presentationTitle}</span>
                      <h3 className="text-lg font-black text-white leading-tight tracking-tight">{img.title}</h3>
                   </div>
                   
                   <div className="flex gap-3">
                     <a 
                       href={img.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1 h-12 bg-white text-slate-950 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-50 transition-colors shadow-xl"
                     >
                       <ExternalLink className="w-3.5 h-3.5" />
                       Náhled
                     </a>
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
