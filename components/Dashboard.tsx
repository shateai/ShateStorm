
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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-6 py-16 max-w-6xl relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-16 gap-8">
            <div className="w-full md:w-auto">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 mb-4"
                >
                    <div className="h-0.5 w-12 bg-blue-500/50"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Přehled vaší flotily</span>
                </motion.div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-6">Vaše Mise</h1>
                
                {/* Quota display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
                   {/* Presentation Quota */}
                   <div className="flex flex-col gap-3 p-6 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-md">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <div className="flex items-center gap-2">
                           <PresentationIcon className="w-3.5 h-3.5 text-blue-400" />
                           <span>Prezentace</span>
                         </div>
                         <span className={quotaUsed >= quotaLimit ? 'text-red-400' : 'text-white'}>{quotaUsed} / {quotaLimit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min((quotaUsed / quotaLimit) * 100, 100)}%` }}
                           className={`h-full rounded-full ${quotaUsed >= quotaLimit ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                         />
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Měsíční sloty flotily</p>
                   </div>

                   {/* Image Quota */}
                   <div className="flex flex-col gap-3 p-6 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-md">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <div className="flex items-center gap-2">
                           <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                           <span>Vizuální palivo</span>
                         </div>
                         <span className={imageQuotaUsed >= imageQuotaLimit ? 'text-red-400' : 'text-white'}>{imageQuotaUsed} / {imageQuotaLimit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min((imageQuotaUsed / imageQuotaLimit) * 100, 100)}%` }}
                           className={`h-full rounded-full ${imageQuotaUsed >= imageQuotaLimit ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}
                         />
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Denní limit generování</p>
                   </div>
                </div>
            </div>
            <button
                onClick={onCreateNew}
                disabled={quotaUsed >= quotaLimit}
                className="group relative flex items-center gap-4 bg-white disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all hover:bg-blue-50 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
            >
                <Plus className="w-6 h-6" />
                Nová Mise
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl border-4 border-[#020617] group-hover:rotate-12 transition-transform">
                    <Rocket className="w-3.5 h-3.5" />
                </div>
            </button>
        </div>

        {presentations.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[3rem] p-24 text-center flex flex-col items-center shadow-2xl"
            >
                <div className="w-24 h-24 bg-blue-500/5 rounded-full flex items-center justify-center mb-8 border border-white/5 group relative">
                    <Star className="w-10 h-10 text-blue-400/30 animate-pulse" />
                    <PresentationIcon className="absolute inset-0 m-auto w-10 h-10 text-white/50" />
                </div>
                <h2 className="text-2xl font-black text-white mb-4">Vesmír je prázdný...</h2>
                <p className="text-slate-400 mb-10 max-w-sm text-lg font-medium">Zatím jste nevypustili žádnou prezentaci na oběžnou dráhu. Začněte nyní.</p>
                <button
                    onClick={onCreateNew}
                    className="text-white bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3"
                >
                    Zahájit první misi <ArrowRight className="w-4 h-4 text-blue-400" />
                </button>
            </motion.div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {presentations.map((p, idx) => (
                <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative"
                >
                    <div 
                        className="absolute inset-0 bg-blue-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"
                    />
                    <div 
                        onClick={() => onSelect(p)}
                        className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 cursor-pointer h-[320px] flex flex-col relative"
                    >
                        <div className="p-8 flex-grow">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                    <PresentationIcon className="w-6 h-6 text-blue-400 group-hover:text-white" />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Smazat tuto misi z archivu?')) {
                                            onDelete(p.id);
                                        }
                                    }}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Smazat prezentaci"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="text-xl font-black text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-200 transition-colors">{p.presentationTitle}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                                {p.topic || 'Bez zadání - koncept'}
                            </p>
                        </div>

                        <div className="px-8 py-6 bg-white/5 border-t border-white/5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('cs-CZ') : 'Dnes'}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    p.status === 'complete' ? 'bg-emerald-500/10 text-emerald-400' : 
                                    p.status === 'generating' ? 'bg-blue-500/10 text-blue-400 animate-pulse' : 
                                    'bg-slate-800 text-slate-500'
                                }`}>
                                    {p.status === 'complete' ? 'Stabilní' : p.status === 'generating' ? 'Start' : 'Příprava'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-700"></div>
                    </div>
                </motion.div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

