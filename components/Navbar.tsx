
import React from 'react';
import { Rocket, LogOut, Compass, Layout, Grid } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  currentStep: string;
  onNavigate: (step: 'dashboard' | 'gallery' | 'explore') => void;
  userEmail?: string | null;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentStep, onNavigate, userEmail, onSignOut }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 pointer-events-none">
      <div className="container mx-auto max-w-7xl flex justify-between items-center bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-4 pointer-events-auto shadow-2xl">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:scale-110 transition-transform">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">SHATE</span>
        </div>

        <div className="flex items-center gap-2">
          <NavItem 
            isActive={currentStep === 'dashboard' || currentStep === 'input' || currentStep === 'outline' || currentStep === 'preview'} 
            onClick={() => onNavigate('dashboard')}
            icon={<Layout className="w-4 h-4" />}
            label="Projekty"
          />
          <NavItem 
            isActive={currentStep === 'explore'} 
            onClick={() => onNavigate('explore')}
            icon={<Compass className="w-4 h-4" />}
            label="Průzkum"
          />
          
          <div className="w-px h-6 bg-white/5 mx-2"></div>
          
          {userEmail ? (
            <div className="flex items-center gap-4 pl-2">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Přihlášen jako</span>
                <span className="text-[10px] font-bold text-blue-400">{userEmail}</span>
              </div>
              <button 
                onClick={onSignOut}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                title="Odhlásit se"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ isActive, onClick, icon, label }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
      isActive 
        ? 'text-white' 
        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
    }`}
  >
    {isActive && (
      <motion.div 
        layoutId="nav-active"
        className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-2xl -z-10"
      />
    )}
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);
