import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, WifiOff, Lock, Smartphone, Scan } from "lucide-react";
import { getStickerData, trackScan, type StickerData } from "@/lib/api";

export default function Scanner() {
  const { id } = useParams<{ id: string }>();
  const [sticker, setSticker] = useState<StickerData | null>(null);
  const [loading, setLoading] = useState(!!id);
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
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading AR experience...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 neon-border text-center max-w-sm w-full space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <WifiOff className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Oops!</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!isHttps) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 neon-border text-center max-w-sm w-full space-y-4">
          <Lock className="w-10 h-10 text-accent mx-auto" />
          <h2 className="text-xl font-bold text-foreground">HTTPS Required</h2>
          <p className="text-muted-foreground text-sm">
            Camera access requires a secure connection. Please access this page via HTTPS.
          </p>
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
          className="glass rounded-2xl p-8 neon-border max-w-sm w-full space-y-5"
        >
          <div className="text-center">
            <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold text-foreground">Protected Sticker</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter password to view</p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
            placeholder="Password"
            className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={verifyPassword}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
          >
            Unlock
          </button>
        </motion.div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center neon-glow"
          >
            <Camera className="w-10 h-10 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AR Scanner</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Create a sticker first, then use the scanner link to view it in AR.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold neon-glow hover:bg-primary/90 transition-colors"
          >
            <Scan className="w-5 h-5" />
            Create a Sticker
          </a>
        </motion.div>
      </div>
    );
  }

  if (!arStarted) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center neon-glow"
          >
            <Camera className="w-10 h-10 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Ready to Scan</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Point your camera at the printed sticker to see the magic
            </p>
          </div>
          <button
            onClick={startAR}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold neon-glow hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
          >
            <Scan className="w-5 h-5" />
            Start Camera
          </button>
        </motion.div>
      </div>
    );
  }

  // AR active state
  return (
    <div className="fixed inset-0 bg-background">
      {/* This would be replaced by the actual A-Frame/MindAR scene */}
      <div className="w-full h-full flex items-center justify-center bg-secondary/20 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-primary/30 rounded-2xl relative">
            <div className="scan-line absolute inset-0 rounded-2xl" />
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
          </div>
        </div>

        {/* Instruction overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-12 left-0 right-0 flex justify-center"
        >
          <div className="glass-strong rounded-full px-5 py-2.5 flex items-center gap-2 neon-border">
            <Smartphone className="w-4 h-4 text-primary animate-pulse-neon" />
            <span className="text-sm text-foreground">Point camera at the sticker</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
