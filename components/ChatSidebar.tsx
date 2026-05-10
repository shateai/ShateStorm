
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Slide } from '../types';

interface ChatSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentSlide: Slide | null;
  currentIndex: number;
  presentationTopic: string;
  onUpdateSlide: (index: number, updates: Partial<Slide>) => void;
  onAddSlide: (title: string, bulletPoints: string[]) => void;
  onRegenerateImage: (index: number) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  isOpen, 
  setIsOpen, 
  currentSlide, 
  currentIndex,
  presentationTopic,
  onUpdateSlide,
  onAddSlide,
  onRegenerateImage
}) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Ahoj! Jsem tvůj kreativní mentor. Můžu ti pomoci upravit prezentaci, přidat slajdy nebo vytvořit nové obrázky. Co máš na srdci?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        tools: [{
          functionDeclarations: [
            {
              name: "update_slide",
              description: "Aktualizuje obsah aktuálního slidu (nadpis nebo odrážky).",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Nový nadpis slidu" },
                  bulletPoints: { type: "array", items: { type: "string" }, description: "Nové odrážky (4-5 bodů)" },
                  layout: { type: "string", enum: ["standard", "reversed", "vertical", "full-image", "text-only", "big-title"], description: "Nové rozvržení" }
                }
              }
            },
            {
              name: "add_slide",
              description: "Přidá nový slide do prezentace.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Nadpis nového slidu" },
                  bulletPoints: { type: "array", items: { type: "string" }, description: "Odrážky (4-5 bodů)" }
                },
                required: ["title", "bulletPoints"]
              }
            },
            {
              name: "regenerate_image",
              description: "Vytvoří nový obrázek pro aktuální nebo specifický slide.",
              parameters: {
                type: "object",
                properties: {
                  slideIndex: { type: "number", description: "Index slidu (pokud není zadán, použije se aktuální)" }
                }
              }
            }
          ]
        }]
      });

      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
      });

      const context = `
        Jsi AI asistent (Kreativní Mentor) pro studenta, který vytváří prezentaci na téma: "${presentationTopic}".
        Právě se dívá na slide č. ${currentIndex + 1} s názvem: "${currentSlide?.title || 'Úvod'}".
        
        TVÁ MISE:
        - Buď srozumitelný. Pokud uživatel něčemu nerozumí, vysvětli to polopatě.
        - Pomáhej aktivně. Pokud uživatel chce něco změnit, použij k tomu nástroje (tools).
        - Odrážky by měly být informativní, ne jen hesla.
        - Navrhuj 4-5 bodů místo 3, pokud je to vhodné pro pochopení.
      `;

      const result = await chat.sendMessage([
        { text: context },
        { text: `Uživatel říká: ${userText}` }
      ]);
      
      const response = result.response;
      const call = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall);

      if (call) {
        const { name, args } = call.functionCall!;
        let feedback = "";

        if (name === "update_slide") {
          onUpdateSlide(currentIndex, args as any);
          feedback = "Jasně, upravil jsem ti tenhle slide podle tvého přání.";
        } else if (name === "add_slide") {
          onAddSlide(args.title as string, args.bulletPoints as string[]);
          feedback = `Přidal jsem nový slide s názvem "${args.title}".`;
        } else if (name === "regenerate_image") {
          const idx = (args.slideIndex as number) ?? currentIndex;
          onRegenerateImage(idx);
          feedback = "Rozumím, generuji ti nový obrázek pro slide.";
        }

        // Send feedback back to AI or just show to user
        setMessages(prev => [...prev, { role: 'ai', text: feedback }]);
      } else {
        const text = response.text();
        setMessages(prev => [...prev, { role: 'ai', text }]);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Omlouvám se, spojení s centrálou bylo přerušeno. Zkus to znovu." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed right-6 top-1/2 -translate-y-1/2 z-[70] w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all ${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-slate-900/40 backdrop-blur-3xl border-l border-white/10 z-[80] shadow-[-20px_0_60px_rgba(0,0,0,0.8)] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.2em]">Kreativní Mentor</h4>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
                            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest opacity-80">Připraven pomoci</span>
                        </div>
                    </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((m, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-xl ${
                            m.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none' 
                                : 'bg-white/5 text-slate-100 rounded-tl-none border border-white/10 backdrop-blur-md'
                        }`}>
                            {m.text}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-6 bg-slate-950/50 backdrop-blur-xl border-t border-white/5">
                <div className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Zeptej se mentora..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all pr-12"
                    />
                    <button 
                        onClick={handleSend}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:opacity-30"
                        disabled={!input.trim() || isLoading}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
