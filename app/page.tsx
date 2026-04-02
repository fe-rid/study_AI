"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import ChatContainer from "@/components/ChatContainer";
import ChatInput from "@/components/ChatInput";
import { streamAI, type Message } from "@/lib/api";
import { useSession, signIn, signOut } from "next-auth/react";
import { getUserSessions, saveUserSession, deleteUserSession } from "@/app/actions/chat";
import { SquarePen, PanelsLeftBottom, MoreHorizontal, MessageSquare, Trash2, Edit2, Check, X, LogIn, LogOut } from "lucide-react";

interface Session {
  id: string;
  name: string;
  messages: Message[];
}

export default function Home() {
  const { data: session, status } = useSession();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDBLoading, setIsDBLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  /* Load persisted theme */
  useEffect(() => {
    const savedTheme = (localStorage.getItem("studyai_theme") as "dark" | "light") ?? "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  /* Load DB sessions on Auth change */
  useEffect(() => {
    if (status === "authenticated") {
      setIsDBLoading(true);
      getUserSessions().then((res) => {
        if (res.sessions) {
          setSessions(res.sessions);
          if (res.sessions.length > 0) {
            setActiveSessionId(res.sessions[0].id);
            setMessages(res.sessions[0].messages);
          }
        }
        setIsDBLoading(false);
      });
    } else if (status === "unauthenticated") {
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
    }
  }, [status]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("studyai_theme", next);
      return next;
    });
  }, []);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false); // auto-close on mobile
  }, []);

  const loadSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setError(null);
      if (window.innerWidth < 768) setIsSidebarOpen(false); // auto-close on mobile
    }
  }, [sessions]);

  const handleDeleteSession = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    
    if (status === "authenticated") {
      deleteUserSession(id);
    }

    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        handleNewSession();
      }
    }
  }, [sessions, activeSessionId, handleNewSession, status]);

  const startEditing = useCallback((id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, []);

  const saveEdit = useCallback((e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (!editingId) return;
    
    const newName = editName.trim() || "Untitled Session";
    setSessions(prev => prev.map(s => 
      s.id === editingId ? { ...s, name: newName } : s
    ));
    
    if (status === "authenticated") {
      const activeMsgs = sessions.find(s => s.id === editingId)?.messages || [];
      saveUserSession(editingId, newName, activeMsgs);
    }

    setEditingId(null);
  }, [editingId, editName, sessions, status]);

  const cancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMsg: Message = { role: "user", content: question };
    const updatedHistory = [...messages, userMsg];

    setMessages(updatedHistory);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Prepare active session logic
    let currentId = activeSessionId;
    let sessionName = "";

    if (!currentId) {
      currentId = Date.now().toString();
      sessionName = question.slice(0, 30) + (question.length > 30 ? "..." : "");
      const newSession: Session = {
        id: currentId,
        name: sessionName,
        messages: updatedHistory
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(currentId);
    } else {
      sessionName = sessions.find(s => s.id === currentId)?.name || "Session";
      setSessions(prev => prev.map(s => 
        s.id === currentId ? { ...s, messages: updatedHistory } : s
      ));
    }

    try {
      // Append a blank assistant message that we will dynamically update via SSE
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const finalAnswer = await streamAI({ question, history: messages }, (textChunk) => {
        setMessages(prev => {
           const msgs = [...prev];
           msgs[msgs.length - 1] = { role: "assistant", content: textChunk };
           return msgs;
        });
      });

      // Save the finalized snapshot to the active session history payload
      const finalHistory = [...updatedHistory, { role: "assistant", content: finalAnswer } as Message];
      
      setMessages(finalHistory);
      setSessions(prev => prev.map(s => 
        s.id === currentId ? { ...s, messages: finalHistory } : s
      ));

      // Persist to Database uniquely if user is logged in natively
      if (status === "authenticated") {
        saveUserSession(currentId, sessionName, finalHistory);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Service notification: StudyAI is experiencing high load.";
      setError(msg);
      // Remove the blank broken message on failure so the user can retry cleanly
      setMessages(updatedHistory);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, activeSessionId, sessions, status]);

  const handleEditMessage = useCallback(async (index: number, newText: string) => {
    if (isLoading || !activeSessionId) return;

    const history = messages.slice(0, index);
    const userMsg: Message = { role: "user", content: newText };
    const updatedHistory = [...history, userMsg];

    setMessages(updatedHistory);
    setIsLoading(true);
    setError(null);

    const session = sessions.find(s => s.id === activeSessionId);
    const sessionName = session?.name || "Session";

    try {
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const finalAnswer = await streamAI({ question: newText, history }, (textChunk) => {
        setMessages(prev => {
           const msgs = [...prev];
           msgs[msgs.length - 1] = { role: "assistant", content: textChunk };
           return msgs;
        });
      });

      const finalHistory = [...updatedHistory, { role: "assistant", content: finalAnswer } as Message];
      setMessages(finalHistory);
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: finalHistory } : s
      ));

      if (status === "authenticated") {
        saveUserSession(activeSessionId, sessionName, finalHistory);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error editing message.";
      setError(msg);
      setMessages(updatedHistory);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeSessionId, messages, sessions, status]);

  const handleRegenerateMessage = useCallback(async (index: number) => {
    if (isLoading || !activeSessionId || index === 0) return;

    const history = messages.slice(0, index - 1);
    const lastUserMsg = messages[index - 1];
    if (lastUserMsg.role !== "user") return;

    const updatedHistory = [...history, lastUserMsg];
    setMessages(updatedHistory);
    setIsLoading(true);
    setError(null);

    const session = sessions.find(s => s.id === activeSessionId);
    const sessionName = session?.name || "Session";

    try {
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const finalAnswer = await streamAI({ question: lastUserMsg.content, history }, (textChunk) => {
        setMessages(prev => {
           const msgs = [...prev];
           msgs[msgs.length - 1] = { role: "assistant", content: textChunk };
           return msgs;
        });
      });

      const finalHistory = [...updatedHistory, { role: "assistant", content: finalAnswer } as Message];
      setMessages(finalHistory);
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: finalHistory } : s
      ));

      if (status === "authenticated") {
        saveUserSession(activeSessionId, sessionName, finalHistory);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error regenerating message.";
      setError(msg);
      setMessages(updatedHistory);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeSessionId, messages, sessions, status]);

  return (
    <div
      className="flex h-[100dvh] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 selection:bg-[#10a37f]/30 antialiased"
      data-theme={theme}
    >
      {/* PROFESSIONAL SIDEBAR (ChatGPT Style) */}
      <aside
        style={{ backgroundColor: "var(--sidebar)", borderColor: "var(--border)" }}
        className={`flex-none w-64 md:w-72 flex flex-col h-full border-r transition-all duration-500 overflow-hidden ${
          isSidebarOpen ? "ml-0" : "-ml-72"
        }`}
      >
        {/* Sidebar Header: New Chat */}
        <div className="p-4 flex-none">
          <button
            onClick={handleNewSession}
            style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:opacity-80 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
               <div className="w-5 h-5 rounded-md text-[#10a37f] flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--border)" }}>
                  <PanelsLeftBottom size={12} strokeWidth={2.5} />
               </div>
               <span className="text-sm font-bold tracking-tight">New session</span>
            </div>
            <SquarePen size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Sidebar History (Dynamic multi-session) */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 no-scrollbar">
           <div className="px-3 mb-2">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-40">History</span>
           </div>
           
           {sessions.length === 0 && (
             <div className="px-3 py-4 text-[11px] font-bold opacity-30 text-center">
               No sessions yet.
             </div>
           )}

           {sessions.map((session) => (
             <div
               key={session.id}
               onClick={() => editingId !== session.id && loadSession(session.id)}
               style={{ 
                 backgroundColor: activeSessionId === session.id && editingId !== session.id ? "var(--surface)" : "transparent"
               }}
               className={`flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--surface)] transition-all group cursor-pointer ${
                 activeSessionId === session.id ? "opacity-100" : "opacity-60 hover:opacity-100"
               }`}
             >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                   <MessageSquare size={13} className="opacity-40 shrink-0" />
                   
                   {editingId === session.id ? (
                     <div className="flex-1 flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                       <input
                         ref={editInputRef}
                         type="text"
                         value={editName}
                         onChange={(e) => setEditName(e.target.value)}
                         onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                         className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 text-[13px] font-bold text-[var(--foreground)] outline-none focus:border-[#10a37f]/50"
                       />
                     </div>
                   ) : (
                     <span className="text-[13px] font-bold transition-colors truncate block w-full">{session.name}</span>
                   )}
                </div>

                {/* Hover Actions */}
                <div className={`flex items-center gap-1.5 shrink-0 ml-2 ${
                  editingId === session.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                }`}>
                  {editingId === session.id ? (
                    <>
                      <button onClick={saveEdit} className="p-1 hover:text-[#10a37f] transition-colors"><Check size={12} strokeWidth={3} /></button>
                      <button onClick={cancelEdit} className="p-1 hover:text-red-500 transition-colors"><X size={12} strokeWidth={3} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => startEditing(session.id, session.name, e)} className="p-1 hover:text-[var(--foreground)] text-[var(--muted)] transition-colors" title="Rename"><Edit2 size={12} strokeWidth={2.5} /></button>
                      <button onClick={(e) => handleDeleteSession(session.id, e)} className="p-1 hover:text-red-500 text-[var(--muted)] transition-colors" title="Delete"><Trash2 size={12} strokeWidth={2.5} /></button>
                    </>
                  )}
                </div>
             </div>
           ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t flex flex-col gap-3" style={{ borderTopColor: "var(--border)" }}>
           
           {status === "authenticated" && session?.user ? (
             <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--surface)] rounded-xl transition-all group" onClick={() => signOut()}>
                <div className="flex items-center gap-3 truncate">
                   <div className="w-6 h-6 rounded-full bg-[#10a37f]/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[#10a37f] uppercase">{session.user.email?.[0] || "U"}</span>
                   </div>
                   <div className="flex flex-col truncate">
                      <span className="text-[11px] font-bold tracking-tight truncate opacity-90">{session.user.email}</span>
                      <span className="text-[9px] opacity-40">Click to logout</span>
                   </div>
                </div>
                <LogOut size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
             </div>
           ) : (
             <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--surface)] rounded-xl transition-all group opacity-80 hover:opacity-100" onClick={() => signIn()}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center group-hover:text-[#10a37f] transition-all bg-[var(--surface)]">
                   <LogIn size={12} />
                </div>
                <span className="text-[11px] font-bold tracking-tight">Log in or sign up</span>
             </div>
           )}

        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full mesh-gradient">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute left-3 top-4 z-[200] p-2 hover:bg-[var(--surface)] rounded-xl transition-all cursor-pointer ${
            isSidebarOpen ? "opacity-30" : "opacity-100 text-[var(--foreground)]"
          }`}
          title={isSidebarOpen ? "Close sidebar" : "Open history"}
        >
          <PanelsLeftBottom size={16} strokeWidth={2.2} />
        </button>

        <Navbar theme={theme} onToggleTheme={handleToggleTheme} onClearChat={handleNewSession} />

        <div className="flex-1 flex flex-col min-h-0 relative">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            onSuggestion={setInput}
            onEdit={handleEditMessage}
            onRegenerate={handleRegenerateMessage}
          />

          {error && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm animate-message">
               <div className="mx-4 p-4 rounded-2xl bg-[var(--background)] border border-red-500/10 shadow-2xl flex items-center justify-between gap-6 backdrop-blur-3xl">
                  <span className="text-[11px] font-semibold text-red-500 leading-tight">
                    {error}
                  </span>
                  <button onClick={() => setError(null)} className="p-1 hover:bg-[var(--surface)] rounded-lg text-red-500 transition-opacity opacity-40 hover:opacity-100">
                     <MoreHorizontal size={14} strokeWidth={2.5} />
                  </button>
               </div>
            </div>
          )}
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        <div className="text-center pb-4 pt-1 pointer-events-none opacity-20">
           <span className="text-[9px] uppercase tracking-widest font-black">
              Private • Managed • Multi-Model
           </span>
        </div>
      </main>
    </div>
  );
}
