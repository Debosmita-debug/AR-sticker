import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, ExternalLink, PartyPopper } from "lucide-react";
import { useState } from "react";

interface UploadSuccessProps {
  arLink: string;
  scanLink: string;
  onReset: () => void;
}

export default function UploadSuccess({ arLink, scanLink, onReset }: UploadSuccessProps) {
  const [copied, setCopied] = useState(false);

  const fullLink = `${window.location.origin}${arLink}`;

  const copy = async () => {
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
        className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center neon-glow"
      >
        <PartyPopper className="w-8 h-8 text-primary" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Sticker Created!</h2>
        <p className="text-muted-foreground mt-1">Share this link or scan the QR code</p>
      </div>

      <div className="glass rounded-2xl p-6 neon-border space-y-4">
        <div className="bg-background/50 p-4 rounded-xl inline-block">
          <QRCodeSVG
            value={fullLink}
            size={180}
            bgColor="transparent"
            fgColor="hsl(174, 100%, 50%)"
            level="M"
          />
        </div>

        <div className="flex items-center gap-2 glass rounded-lg p-2">
          <code className="flex-1 text-sm text-primary truncate px-2">{fullLink}</code>
          <button
            onClick={copy}
            className="shrink-0 p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-lg glass text-foreground hover:bg-secondary transition-colors text-sm font-medium"
        >
          Create Another
        </button>
        <a
          href={scanLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Try Scanner
        </a>
      </div>
    </motion.div>
  );
}
