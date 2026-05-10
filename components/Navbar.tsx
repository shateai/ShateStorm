
import React from 'react';
import { Home, Image as ImageIcon, LogOut, User, Compass } from 'lucide-react';

interface NavbarProps {
  currentStep: string;
  onNavigate: (step: 'dashboard' | 'gallery' | 'explore') => void;
  onSignOut?: () => void;
  userEmail?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentStep, onNavigate, onSignOut, userEmail }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex justify-between items-center bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl px-6 py-3 pointer-events-auto shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg skew-x-[-10deg]">S</span>
             </div>
             <span className="text-white font-black text-xl tracking-tighter">Shate</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => onNavigate('explore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currentStep === 'explore' || currentStep === 'public_view' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Průzkumník
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currentStep === 'dashboard' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Moje Tvorba
            </button>
            <button 
              onClick={() => onNavigate('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currentStep === 'gallery' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Galerie
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
              <User className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-bold text-slate-400">{userEmail}</span>
            </div>
          )}
          {onSignOut && (
            <button 
              onClick={onSignOut}
              className="p-2 hover:bg-red-500/10 rounded-xl group transition-all"
              title="Odhlásit se"
            >
              <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
