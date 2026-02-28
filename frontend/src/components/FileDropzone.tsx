import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, Film, X, CheckCircle2 } from "lucide-react";

interface FileDropzoneProps {
  label: string;
  accept: string;
  icon: "image" | "video";
  file: File | null;
  onFile: (f: File | null) => void;
}

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm"];

export default function FileDropzone({ label, accept, icon, file, onFile }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const validate = (f: File): boolean => {
    const allowed = icon === "image" ? ALLOWED_IMAGE : ALLOWED_VIDEO;
    if (!allowed.includes(f.type)) {
      setError(`Invalid file type. Use ${icon === "image" ? "JPG/PNG" : "MP4/WebM"}`);
      return false;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("File too large (max 100MB)");
      return false;
    }
    setError("");
    return true;
  };

  const handleFile = useCallback(
    (f: File) => {
      if (!validate(f)) return;
      onFile(f);
      if (icon === "image") {
        const url = URL.createObjectURL(f);
        setPreview(url);
      } else {
        const url = URL.createObjectURL(f);
        setPreview(url);
      }
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

  const clear = () => {
    onFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError("");
  };

  const Icon = icon === "image" ? Image : Film;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>

      <AnimatePresence mode="wait">
        {file && preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden glass neon-border"
          >
            {icon === "image" ? (
              <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
            ) : (
              <video src={preview} className="w-full h-48 object-cover" controls muted />
            )}
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-medium backdrop-blur-sm">
                <CheckCircle2 className="w-3 h-3" />
                {file.name}
              </div>
              <button
                onClick={clear}
                className="p-1.5 rounded-md bg-destructive/20 text-destructive backdrop-blur-sm hover:bg-destructive/30 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
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
            className={`relative flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/5 neon-glow"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <div className="scan-line absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
              style={{ opacity: isDragging ? 0.5 : 0 }}
            />
            <Icon className={`w-10 h-10 mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm text-muted-foreground">
              Drop your {icon === "image" ? "target image" : "AR video"} here
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              or click to browse
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
