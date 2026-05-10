
import React from 'react';
import { Plus, Presentation as PresentationIcon, Clock, Trash2, ArrowRight, Sparkles, Rocket, Star, ShieldCheck } from 'lucide-react';
import { Presentation } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  presentations: Presentation[];
  onCreateNew: () => void;
  onSelect: (p: Presentation) => void;
  onDelete: (id: string) => void;
  userId: string | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
  quotaLimit: number;
  quotaUsed: number;
  imageQuotaLimit: number;
  imageQuotaUsed: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  presentations, 
  onCreateNew, 
  onSelect, 
  onDelete, 
  userId, 
  isAuthLoading,
  onSignIn,
  quotaLimit,
  quotaUsed,
  imageQuotaLimit,
  imageQuotaUsed
}) => {
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
        </div>
        <p className="mt-8 text-blue-300/60 font-black tracking-[0.2em] uppercase text-xs animate-pulse">Navigování ke hvězdám...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative cosmic background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] transform rotate-12">
            <Rocket className="w-10 h-10 text-blue-400 -rotate-12" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Vesmírná stanice</h2>
          <p className="text-slate-400 mb-10 text-lg leading-relaxed">Přistupte ke své základně a začněte tvořit prezentace, které oslní celý vesmír.</p>
          <button 
            onClick={onSignIn}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            Vstoupit přes Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none animate-fluid"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none opacity-50 animate-fluid delay-1000"></div>

      <div className="container mx-auto px-6 pt-32 pb-20 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-start mb-20 gap-12 border-b border-white/5 pb-16">
          <div className="w-full md:w-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-transparent"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400">Operační Středisko</span>
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-10 leading-[0.9]">
              Moje <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Tvorba</span>
            </h1>
            
            {/* Stats Bar */}
            <div className="flex flex-wrap gap-8">
              {/* Presentation Stats */}
              <div className="flex flex-col gap-4 min-w-[200px]">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mise v Archivu</span>
                    <span className="text-2xl font-black text-white">{quotaUsed} <span className="text-slate-600">/ {quotaLimit}</span></span>
                  </div>
                  <PresentationIcon className="w-5 h-5 text-blue-500 mb-1 opacity-50" />
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min((quotaUsed / quotaLimit) * 100, 100)}%` }}
                     className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                   />
                </div>
              </div>

              {/* Image Stats */}
              <div className="flex flex-col gap-4 min-w-[200px]">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Palivo AI</span>
                    <span className="text-2xl font-black text-white">{imageQuotaUsed} <span className="text-slate-600">/ {imageQuotaLimit}</span></span>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-500 mb-1 opacity-50" />
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min((imageQuotaUsed / imageQuotaLimit) * 100, 100)}%` }}
                     className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                   />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onCreateNew}
            disabled={quotaUsed >= quotaLimit}
            className="group btn-primary px-12 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-4">
              <Plus className="w-5 h-5" />
              Zahájit Novou Misi
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>

        {presentations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-24 text-center glass-card border-none bg-white/[0.02]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] rounded-[2rem]"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-blue-500/5 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-blue-500/10 rotate-3 group-hover:rotate-6 transition-transform">
                <Rocket className="w-10 h-10 text-blue-500/40" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Hangár je prázdný</h2>
              <p className="text-slate-500 mb-12 max-w-sm mx-auto text-lg leading-relaxed">
                Vaše flotila zatím neobsahuje žádné projekty. Udělejte první krok k ovládnutí vesmíru informací.
              </p>
              <button
                onClick={onCreateNew}
                className="group inline-flex items-center gap-4 px-10 py-5 bg-white text-slate-950 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-50 transition-all hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)]"
              >
                Iniciovat první projekt
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {presentations.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div 
                  onClick={() => onSelect(p)}
                  className="h-full glass-card hover:bg-white/[0.05] transition-all duration-500 cursor-pointer flex flex-col p-8 border-white/5 hover:border-blue-500/30 group-hover:-translate-y-2"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                      <PresentationIcon className="w-7 h-7 text-blue-400 group-hover:text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Definitivně smazat tuto misi?')) {
                          onDelete(p.id);
                        }
                      }}
                      className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-grow mb-10">
                    <h3 className="text-2xl font-black text-white mb-4 line-clamp-2 leading-[1.1] group-hover:text-blue-200 transition-colors tracking-tight">{p.presentationTitle}</h3>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">Zadání:</p>
                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                      {p.topic || 'Čistý list papíru'}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Datum Startu</span>
                        <span className="text-[10px] font-bold text-slate-400">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('cs-CZ') : 'Neznámé'}</span>
                      </div>
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                      p.status === 'complete' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 
                      p.status === 'generating' ? 'bg-blue-500/5 border-blue-500/20 text-blue-400 animate-pulse' : 
                      'bg-slate-800/50 border-white/5 text-slate-500'
                    }`}>
                      {p.status === 'complete' ? 'Stabilní' : p.status === 'generating' ? 'V Tvorbě' : 'Čeká'}
                    </div>
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
