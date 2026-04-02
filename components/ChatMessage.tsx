"use client";

import { useState, useEffect } from "react";
import { Copy, Check, User, Sparkles, Edit2, RefreshCw } from "lucide-react";
import type { Message } from "@/lib/api";

interface ChatMessageProps {
  message: Message;
  index: number;
  onEdit?: (index: number, newText: string) => void;
  onRegenerate?: (index: number) => void;
}

export default function ChatMessage({ message, index, onEdit, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [engineReady, setEngineReady] = useState(false);
  const isUser = message.role === "user";

  /** Markdown Renderer — Now component-aware and reactive */
  const getHtml = (text: string): string => {
    if (!text) return "";
    const MarkdownIt = (window as any).markdownit;
    if (!MarkdownIt) {
       return `<p style="white-space: pre-wrap;">${text}</p>`; // Readable fallback
    }

    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });

    // 1. Pre-process Thinking blocks
    let processed = text.replace(/<think>([\s\S]*?)<\/think>/g, (match: string, content: string) => {
      return `:::thought\n${content.trim()}\n:::`;
    });

    // 2. Customize Code Blocks
    md.renderer.rules.fence = (tokens: any, idx: any) => {
      const token = tokens[idx];
      const lang = (token.info || "code").trim();
      const content = token.content.trim();
      const escapedCode = content.replace(/`/g, '\\`').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      
      return `<div class="code-container">
        <div class="code-header">
          <span class="code-lang">${lang}</span>
          <div class="code-actions">
            <button onclick="navigator.clipboard.writeText(\`${escapedCode}\`).then(() => { this.innerHTML='<svg class=\'w-3 h-3 text-green-500\' fill=\'none\' stroke=\'currentColor\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2.5\' d=\'M5 13l4 4L19 7\'></path></svg> Copied!'; setTimeout(() => this.innerHTML='<svg class=\'w-3 h-3\' fill=\'none\' stroke=\'currentColor\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2.2\' d=\'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2\'></path></svg> Copy', 2000); })" class="copy-btn">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"></path></svg>
              Copy
            </button>
            <button onclick="const blob = new Blob([\`${escapedCode}\`], {type: 'text/plain'}); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'studyai_code.${lang === 'code' ? 'txt' : lang}'; a.click(); window.URL.revokeObjectURL(url);" class="copy-btn">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3"></path></svg>
              Download
            </button>
          </div>
        </div>
        <pre><code class="language-${lang}">${content}</code></pre>
      </div>`;
    };

    let html = md.render(processed);

    // 3. Post-process "thought" back to UI blocks
    html = html.replace(/:::thought([\s\S]*?):::/g, (match: string, content: string) => {
      return `<div class="thought-block">
        <div class="thought-header">Thought Process</div>
        <div class="thought-content">${content.trim()}</div>
      </div>`;
    });

    return html;
  };

  useEffect(() => {
    const checkState = () => {
      if ((window as any).markdownit && (window as any).hljs) {
        setEngineReady(true);
        setTimeout(() => (window as any).hljs.highlightAll(), 50);
      } else {
        setTimeout(checkState, 100);
      }
    };
    if (!isUser) checkState();
  }, [message.content, isUser]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(index, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(message.content);
    }
  };

  return (
    <div
      className={`group w-full py-6 flex flex-col items-center animate-message transform-gpu transition-colors duration-300 ${
        isUser ? "bg-transparent" : "bg-[var(--background)]"
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className={`max-w-[768px] mx-auto w-full px-6 flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar Area */}
        <div 
          style={{ backgroundColor: isUser ? "var(--surface)" : "#10a37f", borderColor: "var(--border)" }} 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-none border shadow-sm"
        >
          {isUser ? (
             <User size={16} strokeWidth={2.2} className="text-[var(--foreground)] opacity-80" />
          ) : (
             <Sparkles size={16} strokeWidth={2} className="text-white" />
          )}
        </div>

        {/* Content Area */}
        <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end text-right" : "items-start text-left"}`}>
          {/* Label (subtle) */}
          <span className="text-[10px] font-bold tracking-widest opacity-20 uppercase px-1">
             {isUser ? "You" : "StudyAI"}
          </span>

          <div
            style={{ 
              backgroundColor: isUser ? "var(--user-bg)" : "transparent",
              color: "var(--foreground)"
            }}
            className={`px-4 py-3 rounded-2xl transition-all duration-300 text-[15.5px] leading-relaxed w-full ${
              isUser ? "rounded-tr-md shadow-sm border border-[var(--border)]" : "px-0 py-0"
            }`}
          >
            {isUser ? (
              isEditing ? (
                 <div className="flex flex-col gap-2 min-w-[300px]">
                   <textarea
                     value={editText}
                     onChange={(e) => setEditText(e.target.value)}
                     onKeyDown={handleKeyDown}
                     autoFocus
                     className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-lg p-2 text-[14px] outline-none focus:border-[#10a37f]/50 resize-y min-h-[60px]"
                   />
                   <div className="flex justify-end gap-2 text-[11px] font-bold mt-1">
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 opacity-50 hover:bg-[var(--surface)] rounded cursor-pointer transition-colors">Cancel</button>
                      <button onClick={submitEdit} className="px-3 py-1.5 bg-[#10a37f] text-white rounded hover:bg-[#0e8a6a] cursor-pointer transition-colors">Save & Submit</button>
                   </div>
                 </div>
              ) : (
                 <p className="whitespace-pre-wrap">{message.content}</p>
              )
            ) : (
                <div
                className="prose-chat"
                dangerouslySetInnerHTML={{ __html: getHtml(message.content) }}
              />
            )}
          </div>

          {/* Action Row */}
          <div className="mt-1 h-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isUser && (
              <>
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-md opacity-40 hover:bg-[var(--surface)] hover:opacity-100 transition-all cursor-pointer ${
                    copied ? "text-green-500 opacity-100" : "text-[var(--foreground)]"
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.2} />}
                </button>
                {onRegenerate && (
                  <button
                    onClick={() => onRegenerate(index)}
                    className="p-1.5 rounded-md opacity-40 hover:bg-[var(--surface)] hover:opacity-100 transition-all cursor-pointer text-[var(--foreground)]"
                    title="Regenerate response"
                  >
                    <RefreshCw size={14} strokeWidth={2.2} />
                  </button>
                )}
              </>
            )}
            {isUser && !isEditing && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md opacity-40 hover:bg-[var(--surface)] hover:opacity-100 transition-all cursor-pointer text-[var(--foreground)]"
                title="Edit question"
              >
                <Edit2 size={13} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
