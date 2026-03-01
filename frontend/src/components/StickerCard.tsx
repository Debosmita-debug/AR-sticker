"use client";

import { motion } from "framer-motion";
import { Copy, Trash2, Eye, Check, ExternalLink, Calendar, QrCode } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { DashboardSticker } from "@/lib/api";
import Link from "next/link";

interface StickerCardProps {
  sticker: DashboardSticker;
  onDelete: (id: string) => void;
  index: number;
}

export default function StickerCard({ sticker, onDelete, index }: StickerCardProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/ar/${sticker.id}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      className="glass rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/5 group hover:border-primary/30 transition-all duration-500 shadow-xl hover:shadow-primary/5"
    >
      {/* Media Preview */}
      <div className="relative h-44 sm:h-56 bg-zinc-900 overflow-hidden">
        {showQR ? (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <QRCodeSVG value={link} size={180} level="M" />
          </div>
        ) : (
          <img
            src={sticker.imageUrl}
            alt={sticker.options?.caption || "Sticker"}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop";
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

        {/* QR toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-primary hover:border-primary/30 transition-all shadow-lg"
        >
          <QrCode className="w-3 h-3" />
          {showQR ? "Image" : "QR"}
        </button>

        {/* Scan Count Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary shadow-lg">
          <Eye className="w-3 h-3" />
          {sticker.scanCount} Scans
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <Link
            href={`/ar/${sticker.id}`}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
          >
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground leading-none truncate max-w-[180px]">
              {sticker.options?.caption || "Unnamed Manifest"}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              <Calendar className="w-3 h-3" />
              {new Date(sticker.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div className="text-[10px] font-black text-primary/40 tracking-tighter">
            REF_{sticker.id.slice(0, 4)}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={copy}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 text-foreground hover:bg-white/10 hover:border-primary/20 transition-all text-xs font-bold uppercase tracking-widest"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Link"}
          </button>

          {showConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(sticker.id)}
                className="h-11 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-foreground transition-all"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
