"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Mail, Lock, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setAuthError("Invalid email or password. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-message">
      <div className="bg-[var(--sidebar)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
        {/* Subtle Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#10a37f]/10 rounded-full blur-3xl group-hover:bg-[#10a37f]/20 transition-all duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#10a37f] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#10a37f]/20 transform group-hover:scale-110 transition-transform duration-500">
            <GraduationCap size={32} className="text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Welcome to StudyAI</h1>
          <p className="text-sm text-[var(--muted)] mb-8 text-center opacity-60">
            Your intelligence companion for every subject. <br />
            Sign in to access your chat history.
          </p>

          {(authError || error) && (
            <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
              {authError || "Authentication failed. Please check your credentials."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within/input:opacity-100 group-focus-within/input:text-[#10a37f] transition-all" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[#10a37f]/50 focus:ring-4 focus:ring-[#10a37f]/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within/input:opacity-100 group-focus-within/input:text-[#10a37f] transition-all" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[#10a37f]/50 focus:ring-4 focus:ring-[#10a37f]/5 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#10a37f] hover:bg-[#0e8a6a] disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:translate-y-[-2px] active:translate-y-[0px] shadow-lg shadow-[#10a37f]/10 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-xs font-bold opacity-30 flex items-center gap-2">
            <Sparkles size={12} className="text-[#10a37f]" />
            Encrypted & Secure Session
          </p>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link href="/" className="text-xs font-bold opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden antialiased">
      {/* Animated Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-[#10a37f]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#10a37f]" />
          <span className="text-sm font-bold opacity-40">Loading security module...</span>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </div>
  );
}
