"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, ChevronDown, Bot, User, Loader2, Trash2 } from "lucide-react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; timestamp: Date };

const SUGGESTIONS = ["Kunlik suv ichish miqdori?","Erta turish maslahatlar","Qisqa mashq dasturi","Stress kamaytirish","Sog'lom ovqatlanish","Yaxshi uxlash sirlari"];
const SYSTEM_PROMPT = `Sen SmartHabit ilovasining AI sog'liqni saqlash murabbiyisan. Foydalanuvchilarga sog'lom turmush tarzi haqida O'ZBEK TILIDA maslahat berasan. Qoidalar: Har doim O'zbek tilida javob ber. Qisqa va amaliy maslahatlar ber (3-5 gap). Ilmiy asoslangan. Iliq ohangda. Mavzular: ovqatlanish, mashq, uyqu, stress, suv ichish, odatlar, motivatsiya, sog'liq. Boshqa mavzularda: "Bu mavzu mening ixtisosim emas" de.`;
const WELCOME_TEXT = "Salom! 👋 Men **SmartHabit AI** — sog'lom turmush tarzi bo'yicha shaxsiy maslahatchiingizman.\n\nOvqatlanish, mashq, uyqu, stress va boshqa sog'liqqa oid savollarga javob beraman. Bemalol so'rang! 💪";

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div initial={{ opacity:0, y:8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
      transition={{ type:"spring", stiffness:400, damping:32 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? "bg-blue-500/25 border border-blue-400/40 text-blue-300" : "bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-400/30 text-orange-300"}`}>
        {isUser ? <User size={13}/> : <Bot size={13}/>}
      </div>
      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser ? "bg-blue-600/25 border border-blue-500/30 text-blue-50 rounded-tr-sm" : "bg-zinc-800/90 border border-zinc-700/60 text-zinc-100 rounded-tl-sm"}`}>
        {msg.content.split("\n").map((line, i) => (
          <p key={i} className={line === "" ? "h-2" : "mb-0.5 last:mb-0"}>
            {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j} className="font-bold text-white">{part.slice(2,-2)}</strong>
                : part
            )}
          </p>
        ))}
        <p className={`text-[10px] mt-1.5 ${isUser ? "text-blue-300/40 text-right" : "text-zinc-600"}`}>
          {msg.timestamp.toLocaleTimeString("uz", { hour:"2-digit", minute:"2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex gap-2.5">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-400/30 text-orange-300 flex-shrink-0"><Bot size={13}/></div>
      <div className="bg-zinc-800/90 border border-zinc-700/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0,1,2].map((i) => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400"
            animate={{ opacity:[0.3,1,0.3], y:[0,-3,0] }}
            transition={{ duration:1, repeat:Infinity, delay:i*0.18 }}/>
        ))}
      </div>
    </motion.div>
  );
}

interface AIHealthCoachProps { isOpen: boolean; onClose: () => void; }

export default function AIHealthCoach({ isOpen, onClose }: AIHealthCoachProps) {
  const [messages, setMessages] = useState<Message[]>([{ id:"welcome", role:"assistant", content:WELCOME_TEXT, timestamp:new Date() }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, isLoading]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  const clearChat = () => {
    setMessages([{ id:`welcome-${Date.now()}`, role:"assistant", content:WELCOME_TEXT, timestamp:new Date() }]);
    setShowSuggestions(true); setInput("");
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;
    setInput(""); setShowSuggestions(false);
    const userMsg: Message = { id:`u-${Date.now()}`, role:"user", content, timestamp:new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const history = [...messages.filter((m) => !m.id.startsWith("welcome")), userMsg]
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: history,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      const replyText =
        typeof data === "object" &&
        data !== null &&
        "text" in data &&
        typeof (data as Record<string, unknown>).text === "string"
          ? ((data as Record<string, unknown>).text as string)
          : "Javob kelmadi.";
      setMessages((prev) => [...prev, { id:`a-${Date.now()}`, role:"assistant", content:replyText, timestamp:new Date() }]);
    } catch (err) {
      console.error("AI xato:", err);
      setMessages((prev) => [...prev, { id:`err-${Date.now()}`, role:"assistant", content:"Kechirasiz, xatolik yuz berdi. Qayta urinib ko'ring. 🙏", timestamp:new Date() }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"/>
          <motion.div
            initial={{ opacity:0, y:50, scale:0.94 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:40, scale:0.94 }}
            transition={{ type:"spring", stiffness:380, damping:32 }}
            className="fixed bottom-20 right-4 left-4 md:left-auto md:w-[380px] z-50 flex flex-col"
            style={{ maxHeight:"calc(100vh - 110px)" }}>
            <div className="flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-[28px] overflow-hidden shadow-2xl"
              style={{ maxHeight:"calc(100vh - 110px)" }}>
              <div className="flex items-center justify-between px-4 py-3.5 bg-zinc-900/80 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg"><Sparkles size={16}/></div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-orange-400 rounded-full border-2 border-zinc-950"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">SmartHabit AI</p>
                    <p className="text-[11px] text-orange-400 mt-0.5">Claude · Sog'liq murabbiyingiz</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={clearChat} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-red-500/20 border border-zinc-700/50 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-all"><Trash2 size={13}/></button>
                  <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-400 hover:text-white flex items-center justify-center transition-all"><ChevronDown size={16}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {messages.map((msg) => <MessageBubble key={msg.id} msg={msg}/>)}
                <AnimatePresence>{isLoading && <TypingIndicator/>}</AnimatePresence>
                <div ref={messagesEndRef}/>
              </div>
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                    className="px-4 pb-2 overflow-hidden border-t border-zinc-800/40">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest my-2">Tez savollar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => void sendMessage(s)}
                          className="text-[11px] px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50 hover:border-orange-500/40 text-zinc-400 hover:text-orange-300 transition-all">{s}</button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="px-3 pb-3 pt-2 border-t border-zinc-800/60">
                <div className="flex items-end gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-2xl px-3 py-2.5 focus-within:border-orange-500/50 transition-colors">
                  <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Savol bering..." rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none resize-none max-h-24 leading-relaxed"
                    style={{ scrollbarWidth:"none" }}/>
                  <button onClick={() => void sendMessage()} disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center disabled:opacity-30 hover:opacity-90 active:scale-95 transition-all flex-shrink-0">
                    {isLoading ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-700 text-center mt-1.5">Enter — yuborish · Shift+Enter — yangi qator</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
