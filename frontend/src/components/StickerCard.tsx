import { motion } from "framer-motion";
import { Copy, Trash2, Eye, Check } from "lucide-react";
import { useState } from "react";
import type { DashboardSticker } from "@/lib/api";

interface StickerCardProps {
  sticker: DashboardSticker;
  onDelete: (id: string) => void;
  index: number;
}

export default function StickerCard({ sticker, onDelete, index }: StickerCardProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const link = `${window.location.origin}/ar/${sticker.id}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl overflow-hidden neon-border group hover:neon-glow transition-shadow duration-300"
    >
      <div className="relative h-40 bg-secondary/50">
        <img
          src={sticker.thumbnailUrl}
          alt={sticker.caption || "Sticker"}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md glass text-xs text-primary font-medium">
          <Eye className="w-3 h-3" />
          {sticker.scanCount}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground truncate">
            {sticker.caption || "Untitled Sticker"}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(sticker.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy Link"}
          </button>

          {showConfirm ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(sticker.id)}
                className="px-3 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-xs font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
