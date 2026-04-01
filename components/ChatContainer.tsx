"use client";

import { useRef, useEffect } from "react";
import type { Message } from "@/lib/api";
import ChatMessage from "./ChatMessage";
import LoadingIndicator from "./LoadingIndicator";
import { GraduationCap, Brain, Code, Globe, MessageCircle } from "lucide-react";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestion?: (text: string) => void;
  onEdit?: (index: number, newText: string) => void;
  onRegenerate?: (index: number) => void;
}

const SUGGESTIONS = [
  { text: "Help me study for my History exam", icon: <Globe size={14} />, category: "History" },
  { text: "Explain React Server Components", icon: <Code size={14} />, category: "Computer Science" },
  { text: "Quantum entanglement for dummies", icon: <Brain size={14} />, category: "Physics" },
];

export default function ChatContainer({ messages, isLoading, onSuggestion, onEdit, onRegenerate }: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar py-1 flex flex-col relative min-h-0 bg-[var(--background)] transition-colors duration-300">
      <div className={`w-full mx-auto flex flex-col ${isEmpty ? "flex-1 justify-center items-center" : ""}`}>
        
        {isEmpty ? (
          /* TRULY MINIMALIST PROFESSIONAL EMPTY STATE */
          <div className="flex flex-col items-center justify-center animate-message text-center gap-8 max-w-[768px] mx-auto px-6">
            
            {/* Logo/Icon */}
            <div 
              style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }} 
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer border border-[var(--border)]"
            >
               <GraduationCap size={32} strokeWidth={2.5} />
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2">
              Ready to learn <br/><span className="text-[#10a37f]">something new today?</span>
            </h1>

            {/* Suggestions Chips */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestion?.(s.text)}
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl border hover:opacity-80 transition-all duration-300 group cursor-pointer"
                >
                  <div className="text-[var(--muted)] group-hover:text-[#10a37f] transition-colors">{s.icon}</div>
                  <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-[13px] font-bold opacity-80 group-hover:opacity-100">{s.text}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)]/50">{s.category}</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-20 mt-4 flex items-center gap-2">
               <MessageCircle size={10} />
               AI-Powered Academic Assistant
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} index={i} />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="w-full flex justify-center py-6">
            <div className="max-w-[768px] w-full px-6 flex gap-4">
              <div 
                style={{ backgroundColor: "#10a37f" }} 
                className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0"
              >
                 <GraduationCap size={16} strokeWidth={2.5} />
              </div>
              <LoadingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
