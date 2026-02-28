import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { getStickerData, type StickerData } from "@/lib/api";

export default function ARViewer() {
  const { id } = useParams<{ id: string }>();
  const [sticker, setSticker] = useState<StickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getStickerData(id)
      .then((data) => {
        setSticker(data);
      })
      .catch((err) => {
        if (err.message.includes("expired")) {
          setExpired(true);
        } else {
          setError("Sticker not found");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading AR scene...</p>
        </motion.div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 neon-border text-center max-w-sm w-full space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Sticker Expired</h2>
          <p className="text-muted-foreground text-sm">
            This AR sticker has expired. Contact the creator for a new link.
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !sticker) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 neon-border text-center max-w-sm w-full space-y-4"
        >
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Not Found</h2>
          <p className="text-muted-foreground text-sm">{error || "This sticker doesn't exist."}</p>
        </motion.div>
      </div>
    );
  }

  // In production, this div would contain the A-Frame scene with MindAR
  return (
    <div className="fixed inset-0 bg-background">
      <div className="w-full h-full flex flex-col items-center justify-center space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-6 neon-border text-center max-w-sm w-full space-y-4"
        >
          <h2 className="text-lg font-bold text-foreground">AR Scene Ready</h2>
          <p className="text-sm text-muted-foreground">
            The A-Frame + MindAR scene will render here when the CDN scripts are loaded in production.
          </p>
          <div className="text-xs text-muted-foreground/60 font-mono glass rounded-lg p-3 text-left">
            <p>Target: {sticker.mindFileUrl}</p>
            <p>Video: {sticker.videoUrl}</p>
            <p>Loop: {sticker.options.loop ? "yes" : "no"}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
