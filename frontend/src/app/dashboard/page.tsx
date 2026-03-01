"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, BarChart3, Plus, LogOut, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";
import StickerCard from "@/components/StickerCard";
import { getDashboard, deleteSticker, type DashboardSticker } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Dashboard() {
    const { accessToken, isAuthenticated, signOut } = useAuth();
    const [stickers, setStickers] = useState<DashboardSticker[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"grid" | "analytics">("grid");

    const loadStickers = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await getDashboard(accessToken);
            setStickers(data.stickers);
        } catch {
            // empty state
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (isAuthenticated) loadStickers();
        else setStickers([]);
    }, [isAuthenticated, loadStickers]);

    const handleDelete = async (id: string) => {
        if (!accessToken) return;
        try {
            await deleteSticker(id, accessToken);
            setStickers((s) => s.filter((st) => st.id !== id));
        } catch {
            // silent fail
        }
    };

    const handleLogout = () => {
        signOut();
        setStickers([]);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="pt-32 pb-20 px-4 max-w-md mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass rounded-3xl p-8 neon-border shadow-2xl shadow-primary/10"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
                                <Plus className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Sticker Dashboard</h2>
                            <p className="text-muted-foreground text-sm mt-2">Sign in to manage your AR creations</p>
                        </div>
                        <AuthForm onSuccess={() => {/* AuthContext handles state */}} />
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-12 sm:pb-20 mt-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-4 sm:gap-6 bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vault</h1>
                        <p className="text-sm text-primary font-medium mt-1 uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                            {stickers.length} Active Stickers
                        </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
                        <div className="flex glass rounded-xl sm:rounded-2xl p-1 gap-1">
                            <button
                                onClick={() => setTab("grid")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${tab === "grid" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5"
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">Gallery</span>
                            </button>
                            <button
                                onClick={() => setTab("analytics")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${tab === "analytics" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5"
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Activity</span>
                            </button>
                        </div>

                        <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />

                        <Link
                            href="/"
                            className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            Create
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="h-10 sm:h-12 w-10 sm:w-12 rounded-xl sm:rounded-2xl glass text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all border border-white/5"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {tab === "grid" ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="glass rounded-2xl sm:rounded-3xl h-56 sm:h-72 animate-pulse overflow-hidden bg-white/5" />
                                    ))}
                                </div>
                            ) : stickers.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-20 sm:py-32 glass rounded-[2rem] sm:rounded-[3rem] neon-border mx-auto max-w-2xl px-6 sm:px-8"
                                >
                                    <div className="w-24 h-24 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                                        <Sparkles className="w-12 h-12 text-primary" />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold">No reality layers found</h3>
                                    <p className="text-muted-foreground mt-4 mb-10 max-w-sm mx-auto leading-relaxed">
                                        Start your AR journey by creating your first interactive sticker experience today.
                                    </p>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all"
                                    >
                                        <Plus className="w-6 h-6" />
                                        Create First Sticker
                                    </Link>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                                    {stickers.map((s, i) => (
                                        <StickerCard key={s.id} sticker={s} onDelete={handleDelete} index={i} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 neon-border border-white/5"
                        >
                            <div className="text-center py-10 sm:py-16 space-y-6">
                                <div className="relative inline-block">
                                    <BarChart3 className="w-16 h-16 sm:w-20 sm:h-20 text-primary opacity-20 mx-auto" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-primary/40 animate-spin" />
                                    </div>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold">Insights coming soon</h3>
                                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                                    We're currently processing interaction data for your stickers.
                                    Detailed scan analytics and geographic distribution will appear here.
                                </p>
                                {stickers.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto mt-8 sm:mt-12">
                                        <div className="glass rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 text-center border border-white/5 hover:border-primary/20 transition-all">
                                            <p className="text-2xl sm:text-4xl font-black gradient-text">
                                                {stickers.reduce((a, s) => a + s.scanCount, 0)}
                                            </p>
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Visits</p>
                                        </div>
                                        <div className="glass rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 text-center border border-white/5 hover:border-primary/20 transition-all">
                                            <p className="text-2xl sm:text-4xl font-black text-foreground">{stickers.length}</p>
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Entities</p>
                                        </div>
                                        <div className="glass rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 text-center border border-white/5 hover:border-primary/20 transition-all">
                                            <p className="text-2xl sm:text-4xl font-black text-accent">
                                                {stickers.length > 0
                                                    ? Math.round(stickers.reduce((a, s) => a + s.scanCount, 0) / stickers.length * 10) / 10
                                                    : 0}
                                            </p>
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Density</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
