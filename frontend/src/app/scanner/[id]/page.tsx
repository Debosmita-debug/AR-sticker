"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, WifiOff, Lock, Smartphone, Scan, ChevronLeft } from "lucide-react";
import { getStickerData, trackScan, type StickerData } from "@/lib/api";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ScannerPage({ params }: PageProps) {
    const { id } = use(params);
    const [sticker, setSticker] = useState<StickerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [arStarted, setArStarted] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [isHttps, setIsHttps] = useState(true);

    useEffect(() => {
        setIsHttps(window.location.protocol === "https:" || window.location.hostname === "localhost");
    }, []);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        getStickerData(id)
            .then((data) => {
                setSticker(data);
                if (data.options.password) {
                    setPasswordRequired(true);
                }
            })
            .catch(() => setError("Sticker not found or has expired"))
            .finally(() => setLoading(false));
    }, [id]);

    const verifyPassword = () => {
        if (sticker && passwordInput === sticker.options.password) {
            setPasswordVerified(true);
            setPasswordRequired(false);
        }
    };

    const startAR = () => {
        setArStarted(true);
        if (id) trackScan(id);
        if (navigator.vibrate) navigator.vibrate(50);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-125" />
                </div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground mt-8 text-lg font-medium tracking-widest uppercase italic"
                >
                    Initializing AR Engine...
                </motion.p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-[2rem] p-10 neon-border text-center max-w-sm w-full space-y-6 shadow-2xl shadow-red-500/10"
                >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 flex items-center justify-center">
                        <WifiOff className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-foreground italic">Signal Lost</h2>
                        <p className="text-muted-foreground mt-2 leading-relaxed">{error}</p>
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

    if (!isHttps) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
                <div className="glass rounded-[2rem] p-10 neon-border text-center max-w-sm w-full space-y-6">
                    <Lock className="w-16 h-16 text-accent mx-auto opacity-80" />
                    <div>
                        <h2 className="text-3xl font-bold text-foreground italic">Secure Link Required</h2>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                            Camera optics require an encrypted connection. Please use HTTPS to proceed.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = window.location.href.replace("http:", "https:")}
                        className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-bold text-sm tracking-widest uppercase"
                    >
                        Switch to HTTPS
                    </button>
                </div>
            </div>
        );
    }

    if (passwordRequired && !passwordVerified) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-[2.5rem] p-10 neon-border max-w-sm w-full space-y-8 shadow-2xl shadow-primary/10"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/30">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground tracking-tight italic">Encrypted Layer</h2>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Authentication required to decrypt AR</p>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
                            placeholder="System Password"
                            className="w-full h-14 px-5 rounded-xl bg-white/5 border border-white/10 text-foreground text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:italic"
                            autoFocus
                        />
                        <button
                            onClick={verifyPassword}
                            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-black text-lg tracking-widest uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                        >
                            Authorize Access
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!arStarted) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-background to-background" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] opacity-20" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-10 max-w-sm relative z-10"
                >
                    <div className="relative inline-block">
                        <motion.div
                            animate={{
                                rotate: [0, 90, 180, 270, 360],
                            }}
                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            className="absolute -inset-8 border border-primary/20 rounded-[3rem] p-4"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                            className="w-28 h-28 mx-auto rounded-[2.5rem] bg-primary/20 flex items-center justify-center border border-primary/30 relative"
                        >
                            <Camera className="w-12 h-12 text-primary" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                        </motion.div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-foreground italic tracking-tight">Lens Ready</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                            Point your camera at the physical medium to materialize the digital layer.
                        </p>
                    </div>

                    <button
                        onClick={startAR}
                        className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-xl tracking-[0.2em] uppercase shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-4 group"
                    >
                        <Scan className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                        Initialize Scanner
                    </button>
                </motion.div>
            </div>
        );
    }

    // AR active state (Simulation)
    return (
        <div className="fixed inset-0 bg-black overflow-hidden select-none">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full max-w-lg max-h-lg relative">
                    {/* Scanning frame */}
                    <div className="absolute inset-0 m-12 border border-primary/20 rounded-[3rem]">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-64 h-64 relative">
                                {/* Animated scanning beam */}
                                <motion.div
                                    animate={{ top: ['10%', '90%', '10%'] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(168,85,247,0.8)] z-20"
                                />

                                {/* Corners */}
                                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl shadow-[-5px_-5px_15px_rgba(168,85,247,0.3)]" />
                                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl shadow-[5px_-5px_15px_rgba(168,85,247,0.3)]" />
                                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl shadow-[-5px_5px_15px_rgba(168,85,247,0.3)]" />
                                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl shadow-[5px_5px_15px_rgba(168,85,247,0.3)]" />
                            </div>
                        </div>
                    </div>

                    {/* Grid lines overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    {/* Data overlay */}
                    <div className="absolute top-8 left-8 right-8 flex justify-between items-start text-primary/80 font-mono text-[10px] tracking-widest uppercase">
                        <div className="space-y-1">
                            <p>ID: {id?.slice(0, 8)}</p>
                            <p>COORD: 40.7128 N, 74.0060 W</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p>SCANMODE: ACTIVE</p>
                            <p>FREQ: 432.18 MHZ</p>
                        </div>
                    </div>

                    <Navbar />

                    {/* Bottom HUD */}
                    <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-2xl px-8 py-4 flex items-center gap-4 neon-border"
                        >
                            <div className="relative">
                                <Smartphone className="w-5 h-5 text-primary" />
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-primary rounded-full -z-10"
                                />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Align Lens with physical target</span>
                        </motion.div>

                        <button
                            onClick={() => setArStarted(false)}
                            className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                        >
                            Terminate Scan Loop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
