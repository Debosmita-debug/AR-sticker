"use client";

import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Sparkles, Share2, Rocket, ImageIcon, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

interface UploadSuccessProps {
  arLink: string;
  scanLink: string;
  imageUrl?: string;
  onReset: () => void;
}

export default function UploadSuccess({ arLink, scanLink, imageUrl, onReset }: UploadSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const baseOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "");

  const normalizeLink = (base: string, link: string) => {
    if (!link) return "";
    if (/^https?:\/\//i.test(link)) return link;
    if (!base) return link;
    if (link.startsWith("/")) return `${base}${link}`;
    return `${base}/${link}`;
  };

  const fullArLink = normalizeLink(baseOrigin, arLink);
  const fullScanLink = normalizeLink(baseOrigin, scanLink);

  const copy = async () => {
    await navigator.clipboard.writeText(fullArLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10 text-center py-8"
    >
      <div className="relative inline-block">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 border border-dashed border-primary/40 rounded-full"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-24 h-24 mx-auto rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 relative z-10 shadow-[0_0_50px_rgba(73,109,219,0.3)]"
        >
          <Rocket className="w-12 h-12 text-primary" />
        </motion.div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-4xl font-black text-foreground italic tracking-tight uppercase">Reality Manifested</h2>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] sm:text-xs">Sticker synchronization successful</p>
      </div>

      <div className="glass rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 neon-border space-y-6 sm:space-y-8 max-w-sm mx-auto shadow-2xl shadow-primary/10">
        {/* Toggle between target image and QR code */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            <QrCode className="w-3 h-3" />
            {showQR ? "Show Target Image" : "Show QR Code"}
          </button>
        </div>

        <div className="bg-white/5 p-4 rounded-3xl inline-block border border-white/5 shadow-inner">
          {showQR ? (
            <div className="w-[200px] h-[200px] rounded-2xl bg-white p-3 flex items-center justify-center">
                <QRCodeSVG
                  value={fullArLink}
                  size={176}
                  level="M"
                  includeMargin={false}
                />
            </div>
          ) : imageUrl ? (
            <div className="relative w-[200px] h-[200px] rounded-2xl overflow-hidden">
              <Image
                src={imageUrl}
                alt="Your AR target image"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 border-2 border-primary/40 rounded-2xl pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary text-center">
                  AR Target Image
                </p>
              </div>
            </div>
          ) : (
            <div className="w-[200px] h-[200px] rounded-2xl bg-white/5 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-relaxed">
            {showQR
              ? <>Print this QR code and place it near your sticker.<br />Anyone can scan it to see the AR video.</>
              : <>Print this image or show it on a screen.<br />Scan it with the AR camera to see the video.</>}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Access Token Link</p>
          <div className="flex items-center gap-2 glass rounded-2xl p-2 border border-white/5">
            <code className="flex-1 text-[11px] text-zinc-400 truncate px-3 font-mono">
              {fullArLink.replace(/^https?:\/\//, '')}
            </code>
            <button
              onClick={copy}
              className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-8 h-14 rounded-2xl glass text-foreground hover:bg-white/5 border border-white/10 transition-all text-xs font-bold uppercase tracking-widest"
        >
          Initialize New
        </button>
        <a
          href={fullScanLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-primary text-primary-foreground hover:shadow-[0_0_30px_rgba(73,109,219,0.4)] transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 group"
        >
          <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Test Payload
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      </div>

      <div className="flex items-center justify-center gap-2 text-primary opacity-40">
        <Sparkles className="w-3 h-3" />
        <span className="text-[8px] font-black uppercase tracking-[0.5em]">System: All sectors green</span>
      </div>
    </motion.div>
  );
}
