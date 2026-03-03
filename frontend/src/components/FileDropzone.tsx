"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, Film, X, CheckCircle2, AlertCircle } from "lucide-react";

interface FileDropzoneProps {
  label: string;
  description?: string;
  accept: string;
  icon: "image" | "video";
  file: File | null;
  onFile: (f: File | null) => void;
}

const ALLOWED_IMAGE = ["image/jpeg", "image/png"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm"];

export default function FileDropzone({ label, description, accept, icon, file, onFile }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const validate = (f: File): boolean => {
    const allowed = icon === "image" ? ALLOWED_IMAGE : ALLOWED_VIDEO;
    if (!allowed.includes(f.type)) {
      setError(`Format unsupported. Use ${icon === "image" ? "JPG/PNG" : "MP4/WEBM"}`);
      return false;
    }
    if (f.size > 5 * 1024 * 1024 && icon === "image") {
      setError("Image exceeds 5MB limit");
      return false;
    }
    if (f.size > 50 * 1024 * 1024 && icon === "video") {
      setError("Video exceeds 50MB limit");
      return false;
    }
    setError("");
    return true;
  };

  const handleFile = useCallback(
    (f: File) => {
      if (!validate(f)) return;
      onFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    },
    [icon, onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError("");
  };

  const Icon = icon === "image" ? ImageIcon : Film;

  return (
    <div className="space-y-3">
      <div className="flex flex-col">
        <label className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">{label}</label>
        {description && <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{description}</span>}
      </div>

      <AnimatePresence mode="wait">
        {file && preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden glass border border-primary/30 group shadow-2xl shadow-primary/5"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = accept;
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) handleFile(f);
              };
              input.click();
            }}
          >
            {icon === "image" ? (
              <img src={preview} alt="Preview" className="w-full h-40 sm:h-52 object-contain bg-black/40" />
            ) : (
              <video src={preview} className="w-full h-40 sm:h-52 object-cover bg-black/40" muted loop autoPlay />
            )}

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">Replace File</span>
            </div>

            <div className="absolute top-3 right-3 flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg">
                <CheckCircle2 className="w-3 h-3" />
                Linked
              </div>
              <button
                onClick={clear}
                className="p-1.5 rounded-full bg-red-500 text-white shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="glass rounded-xl px-3 py-2 border border-white/5 backdrop-blur-md overflow-hidden">
                <p className="text-[10px] font-bold text-white/90 truncate uppercase tracking-widest">{file.name}</p>
                <p className="text-[8px] text-white/40 uppercase font-black">{(file.size / (1024 * 1024)).toFixed(2)} MB • READY</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = accept;
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) handleFile(f);
              };
              input.click();
            }}
            className={`relative flex flex-col items-center justify-center h-40 sm:h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-500 group overflow-hidden ${isDragging
                ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(73,109,219,0.1)]"
                : "border-white/10 hover:border-primary/50 hover:bg-white/5"
              }`}
          >
            {/* Technical grid effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity"
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className={`relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-all duration-500 ${isDragging ? "bg-primary scale-110 shadow-2xl" : "bg-white/5 border border-white/10 group-hover:border-primary/30"}`}>
              <Icon className={`w-8 h-8 transition-colors ${isDragging ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
              {isDragging && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-white/30 rounded-[1.5rem]"
                />
              )}
            </div>

            <div className="text-center space-y-1 relative z-10">
              <p className={`text-sm font-bold uppercase tracking-widest ${isDragging ? "text-primary" : "text-foreground/80"}`}>
                {isDragging ? "Drop Manifest" : "Upload Matrix"}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                Target: {icon === "image" ? "STATIC_IMG" : "DYN_STREAM"}
              </p>
            </div>

            {/* Scanner line animation when dragging */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ top: -10 }}
                  animate={{ top: '100%' }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-primary/40 shadow-[0_0_15px_rgba(73,109,219,0.5)] z-20"
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-[10px] text-red-500 font-black uppercase tracking-widest italic"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
