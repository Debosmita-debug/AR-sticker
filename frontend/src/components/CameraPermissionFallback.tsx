"use client";

import { motion } from "framer-motion";
import { Camera, ShieldAlert, Smartphone } from "lucide-react";

type Reason = "denied" | "unsupported" | "https" | "generic";

interface CameraPermissionFallbackProps {
  reason?: Reason;
  onRetry?: () => void;
}

const messages: Record<Reason, { icon: React.ReactNode; title: string; body: string; action?: string }> = {
  denied: {
    icon: <Camera className="w-10 h-10 text-accent" />,
    title: "Camera Access Denied",
    body: "Please allow camera access in your browser settings, then reload the page.",
    action: "Reload Page",
  },
  unsupported: {
    icon: <Smartphone className="w-10 h-10 text-primary" />,
    title: "Browser Unsupported",
    body: "AR scanning requires a modern browser with camera support (Chrome, Safari, Firefox).",
  },
  https: {
    icon: <ShieldAlert className="w-10 h-10 text-amber-400" />,
    title: "Secure Connection Required",
    body: "Camera access is only available over HTTPS. Please use a secure connection.",
    action: "Switch to HTTPS",
  },
  generic: {
    icon: <Camera className="w-10 h-10 text-muted-foreground" />,
    title: "Camera Unavailable",
    body: "Could not access your camera. Make sure no other app is using it.",
    action: "Try Again",
  },
};

export default function CameraPermissionFallback({
  reason = "generic",
  onRetry,
}: CameraPermissionFallbackProps) {
  const { icon, title, body, action } = messages[reason];

  const handleAction = () => {
    if (reason === "https") {
      window.location.href = window.location.href.replace("http:", "https:");
      return;
    }
    if (reason === "denied" || onRetry) {
      if (onRetry) onRetry();
      else window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-8 text-center"
    >
      <div className="glass rounded-[2rem] p-10 neon-border max-w-sm w-full space-y-6 shadow-2xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed text-sm">{body}</p>
        </div>
        {action && (
          <button
            onClick={handleAction}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
          >
            {action}
          </button>
        )}
      </div>
    </motion.div>
  );
}
