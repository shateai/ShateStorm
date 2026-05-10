
import React, { useState } from 'react';
import { Send, User, Bot, Sparkles, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ChatSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Ahoj! Jsem tvůj asistent SHATE. Můžu ti pomoct s úpravou prezentace nebo rešerší.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', content: 'Rozumím. Pracuji na tom...' }]);
    }, 1000);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 hover:scale-110 active:scale-95 transition-all z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-950 border-l border-white/5 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                   <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-white">Průzkumník AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${m.role === 'user' ? 'bg-slate-800' : 'bg-blue-600/20 text-blue-400'}`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white/[0.03] text-slate-300 border border-white/5 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Zeptej se SHATE..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
