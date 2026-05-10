
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
      .filter(s => s.imageUrl)
      .map(s => ({
        url: s.imageUrl!,
        title: s.title,
        presentationTitle: p.presentationTitle,
        presentationId: p.id
      }))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-blue-500/50"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Vizuální Archiv</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Galerie Shate</h1>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět
          </button>
        </div>

        {allImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
            <ImageIcon className="w-16 h-16 text-slate-800 mb-6" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Zatím nebyly vygenerovány žádné vizuály</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allImages.map((img, idx) => (
              <motion.div 
                key={`${img.url}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative aspect-square bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all"
              >
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{img.presentationTitle}</p>
                   <h3 className="text-sm font-bold text-white mb-4 line-clamp-1">{img.title}</h3>
                   <div className="flex gap-2">
                     <a 
                       href={img.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md"
                     >
                       <ExternalLink className="w-3 h-3" />
                       Otevřít
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
