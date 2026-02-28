import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, BarChart3, Plus, LogOut, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";
import StickerCard from "@/components/StickerCard";
import { getDashboard, deleteSticker, type DashboardSticker } from "@/lib/api";
import { isAuthenticated, logout, onAuthChange } from "@/lib/auth";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [stickers, setStickers] = useState<DashboardSticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"grid" | "analytics">("grid");

  useEffect(() => {
    return onAuthChange(() => setAuthed(isAuthenticated()));
  }, []);

  const loadStickers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboard();
      setStickers(data);
    } catch {
      // will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadStickers();
  }, [authed, loadStickers]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSticker(id);
      setStickers((s) => s.filter((st) => st.id !== id));
    } catch {
      // silent fail
    }
  };

  const handleLogout = () => {
    logout();
    setStickers([]);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-20 px-4">
          <AuthForm onSuccess={() => setAuthed(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Stickers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stickers.length} sticker{stickers.length !== 1 ? "s" : ""} created
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex glass rounded-lg p-0.5">
              <button
                onClick={() => setTab("grid")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTab("analytics")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "analytics" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              to="/"
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Link>

            <button
              onClick={handleLogout}
              className="h-8 px-3 rounded-lg glass text-muted-foreground hover:text-destructive text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass rounded-xl h-64 animate-pulse" />
                  ))}
                </div>
              ) : stickers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-float">
                    <Sparkles className="w-8 h-8 text-primary/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No stickers yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">
                    Create your first AR sticker to get started
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium neon-glow"
                  >
                    <Plus className="w-4 h-4" />
                    Create Sticker
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stickers.map((s, i) => (
                    <StickerCard key={s.id} sticker={s} onDelete={handleDelete} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-8 neon-border"
            >
              <div className="text-center py-12 space-y-3">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">Scan Analytics</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Charts will populate once your stickers start getting scans. 
                  Analytics data is powered by Chart.js.
                </p>
                {stickers.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-6">
                    <div className="glass rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {stickers.reduce((a, s) => a + s.scanCount, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Scans</p>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{stickers.length}</p>
                      <p className="text-xs text-muted-foreground">Stickers</p>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-accent">
                        {stickers.length > 0
                          ? Math.round(stickers.reduce((a, s) => a + s.scanCount, 0) / stickers.length)
                          : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg/Sticker</p>
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
