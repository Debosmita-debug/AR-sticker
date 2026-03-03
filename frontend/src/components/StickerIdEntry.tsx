"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ScanLine, Camera, AlertTriangle } from "lucide-react";

interface StickerIdEntryProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
}

export default function StickerIdEntry({
  title = "Scan AR Sticker",
  subtitle = "Enter your sticker ID to launch the scanner.",
  ctaLabel = "Launch Scanner",
}: StickerIdEntryProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = value.trim();
    if (!id) {
      setError("Enter a sticker ID to continue.");
      return;
    }
    setError("");
    router.push(`/scanner/${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-[2rem] p-8 sm:p-10 neon-border text-center max-w-md w-full space-y-6 shadow-2xl shadow-primary/10"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Camera className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black italic">{title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{subtitle}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. sticker_ab12cd34ef56"
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              aria-label="Sticker ID"
            />
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center gap-2 text-[11px] text-red-400 font-bold uppercase tracking-widest"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-sm shadow-[0_0_30px_rgba(73,109,219,0.3)] hover:shadow-[0_0_40px_rgba(73,109,219,0.5)] transition-all flex items-center justify-center gap-2"
          >
            <ScanLine className="w-4 h-4" />
            {ctaLabel}
          </button>
        </form>

        <Link
          href="/"
          className="block text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}
