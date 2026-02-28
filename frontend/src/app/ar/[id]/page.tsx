"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Loader2, Clock, AlertTriangle, ChevronLeft, Layers, Video } from "lucide-react";
import { getStickerData, type StickerData } from "@/lib/api";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ARViewerPage({ params }: PageProps) {
    const { id } = use(params);
    const [sticker, setSticker] = useState<StickerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expired, setExpired] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        getStickerData(id)
            .then((data) => {
                setSticker(data);
            })
            .catch((err) => {
                if (err.message.includes("expired")) {
                    setExpired(true);
                } else {
                    setError("Sticker not found");
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm tracking-widest uppercase italic">Loading AR Scene...</p>
                </motion.div>
            </div>
        );
    }

    if (expired) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-[2rem] p-10 neon-border text-center max-w-sm w-full space-y-6 shadow-2xl shadow-accent/10"
                >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-accent/20 flex items-center justify-center border border-accent/30">
                        <Clock className="w-10 h-10 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground italic">Layer Expired</h2>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                            This digital manifestation has reached its expiration. Contact the creator for a new token.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-all uppercase tracking-widest"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Home Base
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (error || !sticker) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-[2rem] p-10 neon-border text-center max-w-sm w-full space-y-6 shadow-2xl shadow-red-500/10"
                >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground italic">Void Detected</h2>
                        <p className="text-muted-foreground mt-2 leading-relaxed">{error || "This sticker doesn't exist in our reality branch."}</p>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-all uppercase tracking-widest"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Abort Mission
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-[2.5rem] p-12 neon-border text-center max-w-md w-full space-y-8 shadow-2xl shadow-primary/10 border-white/5"
            >
                <div className="relative inline-block">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-4 border-2 border-dashed border-primary/20 rounded-full"
                    />
                    <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 relative z-10">
                        <Layers className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-foreground italic tracking-tight">AR Layer Prepped</h2>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                        Digital assets are synchronized and ready for materialization.
                        Initiate scan to begin the transition.
                    </p>
                </div>

                <div className="bg-white/5 rounded-3xl p-6 space-y-4 border border-white/5 text-left font-mono">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">Metadata</span>
                        <span className="text-[10px] text-white/30 uppercase">ID: {id?.slice(0, 8)}</span>
                    </div>
                    <div className="space-y-2 text-[11px] text-muted-foreground font-medium">
                        <div className="flex items-center justify-between">
                            <span>Target Map</span>
                            <span className="text-white">Active</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Video Stream</span>
                            <span className="text-white">Encrypted</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Loopback</span>
                            <span className="text-white">{sticker.options.loop ? "Enabled" : "Disabled"}</span>
                        </div>
                    </div>
                </div>

                <Link
                    href={`/scanner/${id}`}
                    className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-xl tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-4 group"
                >
                    <Video className="w-7 h-7 group-hover:scale-110 transition-transform" />
                    Initialize Camera
                </Link>

                <Link
                    href="/"
                    className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                >
                    Return to Command Center
                </Link>
            </motion.div>

            {/* Dynamic particles or something similar could go here */}
            <div className="absolute bottom-8 left-8 text-[8px] font-bold text-white/10 uppercase tracking-[0.5em] vertical-text">
                AR_MANIFEST_SYSTEM_v1.0.6
            </div>
        </div>
    );
}
