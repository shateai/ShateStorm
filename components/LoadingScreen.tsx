
import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Rocket, Sparkles, Database, Brain, Cpu } from 'lucide-react';

interface LoadingScreenProps {
  status: string;
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ status, progress }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="relative mb-20"
        >
            <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>
            
            {/* Orbiting Icons */}
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0"
            >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center shadow-xl">
                   <Brain className="w-4 h-4 text-purple-400" />
                </div>
            </motion.div>
        </motion.div>

        <h2 className="text-2xl font-black text-white mb-6 tracking-tight uppercase tracking-[0.2em]">{status}</h2>
        
        <div className="space-y-6">
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
             />
          </div>
          
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Postup Synchronizace</span>
            <span className="text-xl font-black text-blue-400">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-4">
           <StatusBit icon={<Database className="w-4 h-4" />} label="Data" active={progress > 30} />
           <StatusBit icon={<Brain className="w-4 h-4" />} label="AI" active={progress > 60} />
           <StatusBit icon={<Cpu className="w-4 h-4" />} label="Render" active={progress > 90} />
        </div>
      </div>
    </div>
  );
};

const StatusBit = ({ icon, label, active }: { icon: React.ReactNode, label: string, active: boolean }) => (
    <div className={`p-4 rounded-2xl border transition-all duration-700 flex flex-col items-center gap-2 ${
        active ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.02] border-white/5 text-slate-700'
    }`}>
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
);
