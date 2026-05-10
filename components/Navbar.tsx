
import React from 'react';
import { Home, Image as ImageIcon, LogOut, User, Compass, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  currentStep: string;
  onNavigate: (step: 'dashboard' | 'gallery' | 'explore') => void;
  onSignOut?: () => void;
  userEmail?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentStep, onNavigate, onSignOut, userEmail }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none">
      <div className="max-w-7xl mx-auto flex justify-between items-center bg-slate-950/60 backdrop-blur-2xl border border-white/5 rounded-3xl px-4 md:px-8 py-3 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <button 
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
             <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-blue-500/20 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </div>
             <div className="flex flex-col">
                <span className="text-white font-black text-xl leading-none tracking-tighter">SHATE</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 leading-none mt-1">Vesmírná UI</span>
             </div>
          </button>
          
          <div className="hidden lg:flex items-center gap-2">
            {[
              { id: 'explore', label: 'Průzkumník', icon: Compass },
              { id: 'dashboard', label: 'Moje Tvorba', icon: Home },
              { id: 'gallery', label: 'Galerie', icon: ImageIcon },
            ].map((item) => {
              const active = currentStep === item.id || (item.id === 'explore' && currentStep === 'public_view');
              return (
                <button 
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                    active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {active && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 bg-white/5 border border-white/5 rounded-2xl -z-10 shadow-lg shadow-white/5"
                    />
                  )}
                  <item.icon className={`w-4 h-4 ${active ? 'text-blue-400' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {userEmail && (
            <div className="hidden sm:flex items-center gap-3 pl-3 pr-5 py-1.5 bg-blue-500/5 rounded-full border border-blue-500/10">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                 <User className="w-3 h-3 text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 max-w-[120px] truncate">{userEmail}</span>
            </div>
          )}
          {onSignOut && (
            <button 
              onClick={onSignOut}
              className="group relative p-3 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-2xl transition-all"
              title="Odhlásit se"
            >
              <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
