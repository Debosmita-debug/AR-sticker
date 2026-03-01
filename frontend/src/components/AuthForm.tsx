"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Loader2, Mail, Lock, ShieldCheck } from "lucide-react";
import { login, register } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const { signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Authorization credentials required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password);
      signIn(result.accessToken, result.refreshToken, result.user);
      onSuccess();
    } catch {
      setError(isLogin ? "Authentication failed: Invalid credentials" : "Sync failed: Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="glass rounded-[2rem] p-10 neon-border space-y-8 relative overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

        <div className="text-center space-y-2">
          <div className="inline-block p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-foreground italic tracking-tight uppercase">
            {isLogin ? "Neural Login" : "Core Signup"}
          </h2>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
            {isLogin ? "Access your digital vault" : "Initialize new identity"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600 font-medium"
                placeholder="Ident: mail@domain.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600 font-medium"
                placeholder="Pass: ••••••••"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider text-center italic">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 group active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
            <span className="uppercase tracking-[0.2em]">{loading ? "Processing..." : isLogin ? "Authorize" : "Establish"}</span>
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="w-full text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors text-center uppercase tracking-[0.3em]"
        >
          {isLogin ? "Need access? Request identity" : "Identity found? Sync manifest"}
        </button>
      </div>
    </motion.div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
