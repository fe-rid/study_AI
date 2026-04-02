"use client";

import { Sun, Moon, GraduationCap, ChevronDown, RotateCcw } from "lucide-react";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onClearChat: () => void;
}

export default function Navbar({ theme, onToggleTheme, onClearChat }: NavbarProps) {
  return (
    <nav 
      className="sticky top-0 h-14 flex items-center justify-between px-4 z-[100] transition-all duration-300 glass"
    >
      
      {/* Model Indicator / Selector */}
      <div className="flex items-center gap-2 group cursor-pointer hover:bg-[var(--surface)] px-3 py-1.5 rounded-xl transition-all">
        <div style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }} className="flex items-center justify-center w-6 h-6 rounded-lg shadow-sm">
          <GraduationCap size={14} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-[var(--foreground)] opacity-90">StudyAI LLaMA-3</span>
            <ChevronDown size={12} className="opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-[9px] uppercase font-black tracking-widest text-[#10a37f] -mt-1 leading-none">
             Academic Lab
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onClearChat}
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          className="w-8 h-8 flex items-center justify-center rounded-lg border opacity-20 hover:opacity-100 hover:bg-[var(--surface)] transition-all duration-300 group cursor-pointer"
          title="Reset session"
        >
          <RotateCcw size={12} strokeWidth={2.5} />
        </button>

        <button
          onClick={onToggleTheme}
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          aria-label="Toggle theme"
          className="w-8 h-8 flex items-center justify-center rounded-lg border opacity-20 hover:opacity-100 hover:bg-[var(--surface)] transition-all duration-300 group cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun size={12} strokeWidth={2.5} />
          ) : (
            <Moon size={12} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </nav>
  );
}
