"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat,
  Lock,
  Clock,
  Type,
  Upload,
  Loader2,
  Sparkles,
} from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import UploadSuccess from "@/components/UploadSuccess";
import Navbar from "@/components/Navbar";
import { uploadSticker, type UploadResult } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { compressImage } from "@/lib/compressImage";

export default function Home() {
  const { accessToken } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [loop, setLoop] = useState(true);
  const [caption, setCaption] = useState("");
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("never");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  const canUpload = image && video && !uploading;

  const handleUpload = useCallback(async () => {
    if (!image || !video) return;
    setUploading(true);
    setError("");
    setProgress(0);

    // Simulate progress since fetch doesn't give upload progress natively
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 300);

    try {
      const compressed = await compressImage(image);
      const res = await uploadSticker(compressed, video, {
        loop,
        caption,
        password,
        expiry,
      }, accessToken);
      setProgress(100);
      setTimeout(() => setResult(res), 400);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  }, [image, video, loop, caption, password, expiry]);

  const reset = () => {
    setImage(null);
    setVideo(null);
    setCaption("");
    setPassword("");
    setResult(null);
    setProgress(0);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 opacity-50" />
        <div className="absolute top-0 right-0 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-primary/20 rounded-full blur-[80px] sm:blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-accent/10 rounded-full blur-[80px] sm:blur-[120px] -z-10" />

        <div className="relative max-w-2xl mx-auto px-4 pt-24 sm:pt-32 pb-8 sm:pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass neon-border text-xs text-primary font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              AR-Powered Video Stickers
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              Turn any print into
              <span className="block gradient-text mt-2 pb-2">living media</span>
            </h1>
            <p className="text-muted-foreground mt-4 sm:mt-6 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              Upload an image and video to create magic links.
              Scan with any smartphone to see your content come alive in AR.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pb-16 sm:pb-24">
        <AnimatePresence mode="wait">
          {result ? (
            <UploadSuccess
              key="success"
              arLink={result.arPageUrl}
              scanLink={result.scanPageUrl}
              imageUrl={result.imageUrl}
              onReset={reset}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              {/* File uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FileDropzone
                  label="Target Image"
                  description="The image to be scanned (JPG/PNG, max 5MB)"
                  accept="image/jpeg,image/png"
                  icon="image"
                  file={image}
                  onFile={setImage}
                />
                <FileDropzone
                  label="AR Video"
                  description="Animated content in AR (MP4/WebM, max 50MB)"
                  accept="video/mp4,video/webm"
                  icon="video"
                  file={video}
                  onFile={setVideo}
                />
              </div>

              {/* Options */}
              <div className="glass rounded-2xl p-4 sm:p-6 neon-border space-y-4 sm:space-y-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </span>
                  Sticker Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Loop toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-sm">
                      <Repeat className="w-4 h-4 text-primary" />
                      <span>Loop Video</span>
                    </div>
                    <button
                      onClick={() => setLoop(!loop)}
                      className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center p-1 ${loop ? "bg-primary" : "bg-zinc-700"
                        }`}
                    >
                      <motion.div
                        animate={{ x: loop ? 20 : 0 }}
                        className="w-4 h-4 rounded-full bg-white shadow-lg"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Expiry */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <select
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="7" className="bg-background">7 Days</option>
                      <option value="30" className="bg-background">30 Days</option>
                      <option value="90" className="bg-background">90 Days</option>
                      <option value="never" className="bg-background">Unlimited</option>
                    </select>
                  </div>

                  {/* Caption */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 md:col-span-2">
                    <Type className="w-4 h-4 text-primary shrink-0" />
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Enter a descriptive caption (optional)"
                      maxLength={100}
                      className="flex-1 bg-transparent border-none text-sm focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>

                  {/* Password */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 md:col-span-2">
                    <Lock className="w-4 h-4 text-primary shrink-0" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Add password protection (optional)"
                      maxLength={50}
                      className="flex-1 bg-transparent border-none text-sm focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* Upload progress */}
              <AnimatePresence>
                {uploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex justify-between text-xs font-medium text-primary">
                      <span>Uploading to secure server...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-neon-blue to-primary"
                        style={{ width: `${progress}%` }}
                        animate={{
                          backgroundPosition: ["0% center", "100% center"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Generate button */}
              <motion.button
                whileHover={{ scale: canUpload ? 1.02 : 1 }}
                whileTap={{ scale: canUpload ? 0.98 : 1 }}
                onClick={handleUpload}
                disabled={!canUpload}
                className="w-full h-12 sm:h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(73,109,219,0.3)] hover:shadow-[0_0_40px_rgba(73,109,219,0.5)] transition-all disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed group"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                )}
                {uploading ? "Synthesizing AR Reality..." : "Generate Magic Sticker"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
