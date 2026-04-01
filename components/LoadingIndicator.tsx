"use client";

import { Sparkles } from "lucide-react";

export default function LoadingIndicator() {
  return (
    <div className="flex items-start gap-4 mb-8 animate-in transition-all">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface)] text-[var(--muted)]/50 ring-1 ring-[var(--border)] overflow-hidden">
        <Sparkles size={14} strokeWidth={2.2} />
      </div>

      {/* Bubble Container */}
      <div className="flex flex-col gap-2.5">
        <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-[var(--ai-bubble)] border border-[var(--border)] shadow-sm flex items-center gap-1.5 min-w-[64px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]/40 typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]/40 typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]/40 typing-dot" />
        </div>
        
        <span className="text-[10px] text-[var(--muted)]/30 tracking-wider font-semibold uppercase px-1">
          StudyAI is thinking...
        </span>
      </div>
    </div>
  );
}
