"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  Layers,
  ScanLine,
  Lock,
  QrCode,
  Share2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getStickerMetadata, type StickerMetadata } from "@/lib/api";
import PasswordModal from "@/components/PasswordModal";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ARViewerPage({ params }: PageProps) {
  const { id } = use(params);
  const [meta, setMeta] = useState<StickerMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verifiedPassword, setVerifiedPassword] = useState<string | undefined>(undefined);
  const [pwError, setPwError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!id) return;
    getStickerMetadata(id)
      .then((data) => {
        setMeta(data);
        if (data.isPasswordProtected && !verifiedPassword) {
          setShowPasswordModal(true);
        }
      })
      .catch((err: Error) => {
        if (err.message === "STICKER_EXPIRED") setExpired(true);
        else setError("Sticker not found or unavailable.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePasswordSubmit = (pw: string) => {
    // The scanner page will do the actual verification with the backend.
    // Here we just pass the password through as a query param to the scanner.
    setPwError("");
    setVerifiedPassword(pw);
    setShowPasswordModal(false);
  };

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
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 neon-border text-center max-w-sm w-full space-y-4 sm:space-y-6 shadow-2xl shadow-accent/10"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-accent/20 flex items-center justify-center border border-accent/30">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic">Layer Expired</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              This digital manifestation has reached its expiration.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-all uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Home Base
          </Link>
        </motion.div>
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 neon-border text-center max-w-sm w-full space-y-4 sm:space-y-6 shadow-2xl shadow-red-500/10"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic">Void Detected</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              {error || "This sticker doesn't exist."}
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-all uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Abort Mission
          </Link>
        </motion.div>
      </div>
    );
  }

  // Password modal shown if sticker is protected and password not yet entered
  if (showPasswordModal || (meta.isPasswordProtected && !verifiedPassword)) {
    return (
      <>
        <div className="fixed inset-0 bg-background" />
        <PasswordModal
          open
          error={pwError}
          onSubmit={handlePasswordSubmit}
        />
      </>
    );
  }

  // Build scanner URL – pass password as query param if needed
  const scannerHref = verifiedPassword
    ? `/scanner/${id}?pw=${encodeURIComponent(verifiedPassword)}`
    : `/scanner/${id}`;

  const daysLeft = meta.daysUntilExpiry;
  const expiryLabel =
    daysLeft > 30 ? `${daysLeft}d remaining` : daysLeft <= 0 ? "Expired" : `${daysLeft}d left`;

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />

      <PasswordModal
        open={showPasswordModal}
        error={pwError}
        onSubmit={handlePasswordSubmit}
        onClose={() => setShowPasswordModal(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 neon-border text-center max-w-md w-full space-y-6 sm:space-y-8 shadow-2xl shadow-primary/10 border-white/5"
      >
        {/* Icon */}
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

        {/* Heading */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight">AR Layer Ready</h2>
          {meta.caption && (
            <p className="text-primary/80 font-semibold text-base">{meta.caption}</p>
          )}
          <p className="text-muted-foreground leading-relaxed font-medium text-sm">
            Point your camera at the physical sticker to see the AR experience come to life.
          </p>
        </div>

        {/* Metadata panel */}
        <div className="bg-white/5 rounded-3xl p-5 space-y-3 border border-white/5 text-left font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <span className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">Metadata</span>
            <span className="text-white/30 uppercase">ID: {id?.slice(0, 8)}</span>
          </div>
          {[
            ["Scan Count", `${meta.scanCount.toLocaleString()} scans`],
            ["Expires", expiryLabel],
            ["Access", meta.isPasswordProtected ? "Protected 🔒" : "Public 🌐"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-muted-foreground">
              <span>{label}</span>
              <span className="text-white font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Password indicator */}
        {meta.isPasswordProtected && verifiedPassword && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-400 font-bold uppercase tracking-widest">
            <Lock className="w-3 h-3" />
            Access Granted
          </div>
        )}

        {/* QR Code for sharing */}
        <div className="space-y-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            {showQR ? <Layers className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
            {showQR ? "Hide QR" : "Share via QR Code"}
          </button>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col items-center gap-3"
            >
              <div className="bg-white p-3 rounded-2xl inline-block">
                <QRCodeSVG
                  value={`${origin}/scanner/${id}`}
                  size={160}
                  level="M"
                />
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                Anyone can scan this to view the AR experience
              </p>
            </motion.div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={scannerHref}
          className="w-full h-14 sm:h-16 rounded-2xl bg-primary text-primary-foreground font-black text-lg sm:text-xl tracking-[0.15em] uppercase shadow-[0_0_30px_rgba(73,109,219,0.3)] hover:shadow-[0_0_50px_rgba(73,109,219,0.5)] transition-all flex items-center justify-center gap-3 sm:gap-4 group"
        >
          <ScanLine className="w-7 h-7 group-hover:scale-110 transition-transform" />
          Launch Scanner
        </Link>

        <Link
          href="/"
          className="block text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
        >
          Return to Command Center
        </Link>
      </motion.div>
    </div>
  );
}

