"use client";

import { useState } from "react";
import { Copy, Check, User, Sparkles, Edit2, RefreshCw } from "lucide-react";
import type { Message } from "@/lib/api";

interface ChatMessageProps {
  message: Message;
  index: number;
  onEdit?: (index: number, newText: string) => void;
  onRegenerate?: (index: number) => void;
}

/** Markdown Renderer — Theme Aware */
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^\s*[-*•] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>(\n|$))+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .split(/\n\n+/)
    .map((block) => {
      if (
        block.startsWith("<h") ||
        block.startsWith("<ul") ||
        block.startsWith("<pre") ||
        block.startsWith("<blockquote") ||
        block.startsWith("<li")
      ) return block;
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default function ChatMessage({ message, index, onEdit, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const isUser = message.role === "user";

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
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
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
