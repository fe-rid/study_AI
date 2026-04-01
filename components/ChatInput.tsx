"use client";

import { useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { ArrowUp, Sparkles, Command } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSubmit();
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div 
      style={{ backgroundImage: "linear-gradient(to top, var(--background), var(--background) 90%, transparent)" }}
      className="w-full h-auto flex flex-col items-center sticky bottom-0 z-50 px-6 py-6 pb-2 transition-colors duration-300"
    >
      <div className="max-w-[768px] mx-auto w-full relative">
        
        <div 
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          className="relative group transition-all duration-300 rounded-[1.5rem] border flex items-end gap-3 px-4 py-3 focus-within:border-[var(--muted)]/40 focus-within:ring-1 focus-within:ring-[var(--muted)]/10 shadow-lg group-hover:shadow-[0_10px_40px_rgba(0,0,0,0.05)]"
        >
          
          <div className="mb-2 ml-1 opacity-20 group-focus-within:opacity-100 group-focus-within:text-[#10a37f] transition-all">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Help me study..."
            className="flex-1 text-[16px] font-medium bg-transparent border-none outline-none resize-none text-[var(--foreground)] placeholder:opacity-20 py-2 selection:bg-[#10a37f]/30 transition-all max-h-56 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          />

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            style={{ 
              backgroundColor: value.trim() && !isLoading ? "var(--foreground)" : "var(--muted)", 
              color: "var(--background)",
              opacity: value.trim() && !isLoading ? 1 : 0.1
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 mb-1 cursor-pointer disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm"
            aria-label="Send message"
          >
            {isLoading ? (
              <span 
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              />
            ) : (
              <ArrowUp size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>

        <div className="text-center mt-3 flex items-center justify-center gap-1.5 opacity-20 group-focus-within:opacity-40 transition-opacity">
           <Command size={10} />
           <p className="text-[10px] font-bold tracking-tight">
             Enter to send session commands &nbsp; • &nbsp; StudyAI LLaMA-3
           </p>
        </div>
      </div>
    </div>
  );
}
