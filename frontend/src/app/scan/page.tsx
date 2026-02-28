"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScanLine, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ScanPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleGo = useCallback(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter a sticker code.");
      return;
    }
    setError("");
    // Support both full URLs and plain IDs
    // e.g. "https://example.com/ar/abc123" → "abc123"
    const match = trimmed.match(/(?:\/ar\/|\/scanner\/)([A-Za-z0-9_-]+)/);
    const id = match ? match[1] : trimmed;
    router.push(`/scanner/${encodeURIComponent(id)}`);
  }, [code, router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 opacity-50" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] -z-10" />

        <div className="relative max-w-md mx-auto px-4 pt-36 pb-20 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8 w-full"
          >
            {/* Icon */}
            <div className="relative inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute -inset-6 border-2 border-dashed border-primary/20 rounded-full"
              />
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 relative z-10">
                <ScanLine className="w-12 h-12 text-primary" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black italic tracking-tight">
                Scan a Sticker
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed font-medium max-w-sm mx-auto">
                Enter the sticker code or paste the AR link to launch the camera and see the magic.
              </p>
            </div>

            {/* Input */}
            <div className="w-full space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Sticker code or AR link…"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleGo()}
                  className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 px-6 text-lg font-medium placeholder:text-white/30 outline-none transition-all"
                />
                <button
                  onClick={handleGo}
                  disabled={!code.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest">
                  {error}
                </p>
              )}
            </div>

            {/* Hint */}
            <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
              <Sparkles className="w-3 h-3" />
              The code is on the AR link you received
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
