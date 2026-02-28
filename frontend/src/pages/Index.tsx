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
import heroBg from "@/assets/hero-bg.jpg";

export default function Index() {
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
      const res = await uploadSticker(image, video, {
        loop,
        caption,
        password,
        expiry,
      });
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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

        <div className="relative max-w-2xl mx-auto px-4 pt-28 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass neon-border text-xs text-primary font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              AR-Powered Video Stickers
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Turn any print into
              <span className="block gradient-text">living media</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md mx-auto">
              Upload an image and video. Get a magic link. Anyone who scans your
              sticker sees the video play in augmented reality.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          {result ? (
            <UploadSuccess
              key="success"
              arLink={result.arPageUrl}
              scanLink={result.scanPageUrl}
              onReset={reset}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* File uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileDropzone
                  label="Target Image"
                  accept="image/jpeg,image/png,image/webp"
                  icon="image"
                  file={image}
                  onFile={setImage}
                />
                <FileDropzone
                  label="AR Video"
                  accept="video/mp4,video/webm"
                  icon="video"
                  file={video}
                  onFile={setVideo}
                />
              </div>

              {/* Options */}
              <div className="glass rounded-xl p-5 neon-border space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </span>
                  Options
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Loop toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setLoop(!loop)}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                        loop ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <motion.div
                        animate={{ x: loop ? 16 : 0 }}
                        className="w-5 h-5 rounded-full bg-foreground shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <Repeat className="w-3.5 h-3.5" />
                      Loop Video
                    </div>
                  </label>

                  {/* Expiry */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="1d">1 Day</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>

                  {/* Caption */}
                  <div className="flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Caption (optional)"
                      maxLength={100}
                      className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Password */}
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (optional)"
                      maxLength={50}
                      className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
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
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-neon-purple"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive text-center"
                >
                  {error}
                </motion.p>
              )}

              {/* Upload button */}
              <motion.button
                whileHover={{ scale: canUpload ? 1.01 : 1 }}
                whileTap={{ scale: canUpload ? 0.98 : 1 }}
                onClick={handleUpload}
                disabled={!canUpload}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-all neon-glow"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {uploading ? "Creating AR Sticker..." : "Create AR Sticker"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
