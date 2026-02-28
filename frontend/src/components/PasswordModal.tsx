"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface PasswordModalProps {
  open: boolean;
  error?: string;
  onSubmit: (password: string) => void;
  onClose?: () => void;
}

export default function PasswordModal({ open, error, onSubmit, onClose }: PasswordModalProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="w-full max-w-sm glass rounded-[2rem] p-8 neon-border shadow-2xl shadow-primary/20 relative"
          >
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-primary/30">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black tracking-tight italic">Protected Layer</h2>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Enter the access code to unlock this AR sticker
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Access Code"
                autoFocus
                className="w-full h-14 px-5 rounded-xl bg-white/5 border border-white/10 text-foreground text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600 placeholder:text-sm placeholder:tracking-widest"
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wide">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!value.trim()}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-base uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Unlock
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
