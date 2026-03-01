"use client";

/**
 * /scanner/[id] – Full-screen AR camera with MindAR image tracking.
 *
 * Script loading order (both injected into document.head):
 *   1. A-Frame 1.4.2  (injected into <head>, onload triggers step 2)
 *   2. MindAR  1.2.5  (injected into <head> AFTER A-Frame finishes)
 *
 * After BOTH scripts are loaded AND sticker data is fetched:
 *   - Compute target image aspect ratio
 *   - Inject <a-scene> into the DOM container
 *   - Wire targetFound / targetLost event listeners
 *
 * Cleanup:
 *   - Stop MindAR system and remove <a-scene> on route change / unmount
 */

import { useState, useEffect, use, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Loader2,
  ChevronLeft,
  Lock,
  WifiOff,
  ShieldAlert,
} from "lucide-react";
import { getStickerData, getStickerMetadata, trackScan, type StickerData } from "@/lib/api";
import CameraPermissionFallback from "@/components/CameraPermissionFallback";
import PasswordModal from "@/components/PasswordModal";

// ── Types ──────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

type Phase =
  | "loading"       // Fetching sticker metadata
  | "password"      // Awaiting password input
  | "preflight"     // Showing "Point camera at sticker" CTA
  | "ar-init"       // Scripts loading + scene building
  | "ar-active"     // AR scene running
  | "error"
  | "expired"
  | "camera-denied"
  | "unsupported"
  | "https-required";

// ── Component ──────────────────────────────────────────────────────────────

export default function ScannerPage({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sticker, setSticker] = useState<StickerData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  // Pre-populate password from URL query param (?pw=...) for deep-link flow from ar/[id]
  const [password, setPassword] = useState<string | undefined>(
    () => searchParams.get("pw") ?? undefined
  );
  const [pwError, setPwError] = useState("");
  const [targetDetected, setTargetDetected] = useState(false);

  // Script loading state
  const aframeLoaded = useRef(false);
  const mindARLoaded = useRef(false);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneInjected = useRef(false);

  // ── Load scripts into <head> ─────────────────────────────────────────────
  // Inject A-Frame into <head> immediately on mount (not via <Script> which
  // goes into <body>). MindAR is injected after A-Frame finishes loading.
  useEffect(() => {
    if (document.getElementById("aframe-script")) {
      // Already injected (e.g. hot-reload)
      aframeLoaded.current = true;
      if (document.getElementById("mindar-script")) {
        mindARLoaded.current = true;
      }
      return;
    }

    const aframeScript = document.createElement("script");
    aframeScript.id = "aframe-script";
    aframeScript.src = "https://aframe.io/releases/1.4.2/aframe.min.js";
    aframeScript.onload = () => {
      aframeLoaded.current = true;

      // Now inject MindAR into <head> after A-Frame is ready
      const mindarScript = document.createElement("script");
      mindarScript.id = "mindar-script";
      mindarScript.src = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js";
      mindarScript.onload = () => {
        mindARLoaded.current = true;
        // If sticker data is already loaded, try injecting the scene
        if (sticker && phase === "ar-init") {
          tryInjectScene();
        }
      };
      document.head.appendChild(mindarScript);
    };
    document.head.appendChild(aframeScript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isSecure) setPhase("https-required");
  }, []);

  // ── Fetch metadata (lightweight first) ───────────────────────────────────
  useEffect(() => {
    if (!id || phase === "https-required") return;

    getStickerMetadata(id)
      .then((meta) => {
        if (meta.isPasswordProtected && !password) {
          setPhase("password");
        } else {
          fetchFullData();
        }
      })
      .catch((err: Error) => {
        if (err.message === "STICKER_EXPIRED") setPhase("expired");
        else { setErrorMsg("Sticker not found or has expired."); setPhase("error"); }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchFullData = useCallback(
    (pw?: string) => {
      const resolvedPw = pw ?? password;
      getStickerData(id, resolvedPw)
        .then((data) => {
          setSticker(data);
          // Auto-start: skip preflight, jump straight to AR init
          setPhase("ar-init");
        })
        .catch((err: Error) => {
          if (err.message === "PASSWORD_REQUIRED") { setPhase("password"); }
          else if (err.message === "INVALID_PASSWORD") { setPwError("Incorrect password. Try again."); }
          else if (err.message === "STICKER_EXPIRED") { setPhase("expired"); }
          else { setErrorMsg(err.message || "Failed to load sticker"); setPhase("error"); }
        });
    },
    [id, password]
  );

  const handlePasswordSubmit = (pw: string) => {
    setPwError("");
    setPassword(pw);
    fetchFullData(pw);
  };

  // ── Scene injection (runs when both scripts + sticker data are ready) ─────
  const tryInjectScene = useCallback(async () => {
    if (
      !aframeLoaded.current ||
      !mindARLoaded.current ||
      !sticker ||
      sceneInjected.current ||
      !sceneContainerRef.current
    ) return;

    sceneInjected.current = true;
    setPhase("ar-init");

    // Wait for AFRAME to finish registering its custom elements on the global scope
    await waitForAFRAME();

    // Compute target image aspect ratio
    let planeWidth = 1;
    let planeHeight = 1;
    try {
      const imgAspect = await getImageAspectRatio(sticker.imageUrl);
      if (imgAspect >= 1) {
        planeWidth = 1;
        planeHeight = 1 / imgAspect;
      } else {
        planeWidth = imgAspect;
        planeHeight = 1;
      }
    } catch {
      // Default to 1:1 on error
    }

    const loopAttr = sticker.options.loop ? "loop" : "";

    const sceneHTML = /* html */ `
<a-scene
  id="ar-scene"
  mindar-image="imageTargetSrc: ${sticker.mindFileUrl}; autoStart: true; uiLoading: no; uiScanning: no; uiError: no;"
  color-space="sRGB"
  renderer="colorManagement: true; physicallyCorrectLights: true"
  vr-mode-ui="enabled: false"
  device-orientation-permission-ui="enabled: false"
  style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:20;"
>
  <a-assets timeout="10000">
    <video
      id="ar-video"
      src="${sticker.videoUrl}"
      ${loopAttr}
      playsinline
      webkit-playsinline
      crossorigin="anonymous"
      preload="auto"
      muted
    ></video>
  </a-assets>

  <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

  <a-entity mindar-image-target="targetIndex: 0">
    <a-plane
      id="ar-plane"
      src="#ar-video"
      position="0 0 0"
      height="${planeHeight.toFixed(4)}"
      width="${planeWidth.toFixed(4)}"
      rotation="0 0 0"
      material="shader: flat; side: double; transparent: true; opacity: 1"
    ></a-plane>
  </a-entity>
</a-scene>`;

    // Inject into DOM
    sceneContainerRef.current.innerHTML = sceneHTML;

    // Wait for scene to initialise before attaching listeners
    const scene = sceneContainerRef.current.querySelector("#ar-scene") as Element & { systems?: Record<string, { stop?: () => void }> };
    if (!scene) return;

    scene.addEventListener("arReady", () => {
      setPhase("ar-active");
      // Record scan
      trackScan(id).catch(() => {});
    });

    scene.addEventListener("arError", () => {
      setErrorMsg("AR initialisation failed. Check camera permissions.");
      setPhase("error");
    });

    const targetEl = scene.querySelector("[mindar-image-target]");
    if (targetEl) {
      targetEl.addEventListener("targetFound", () => {
        setTargetDetected(true);

        // Haptic feedback
        navigator.vibrate?.(200);

        // Play video (preloaded with preload="auto")
        const video = document.getElementById("ar-video") as HTMLVideoElement | null;
        if (video) {
          // Unmute after first user interaction (autoplay policy)
          video.muted = false;
          video.play().catch(() => {
            // Autoplay blocked – try muted
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      });

      targetEl.addEventListener("targetLost", () => {
        setTargetDetected(false);

        const video = document.getElementById("ar-video") as HTMLVideoElement | null;
        if (video) {
          video.pause();
        }
      });
    }
  }, [sticker, id]);

  // Auto-start: when phase becomes ar-init and scripts are already loaded, inject immediately
  useEffect(() => {
    if (phase === "ar-init" && aframeLoaded.current && mindARLoaded.current && sticker) {
      tryInjectScene();
    }
  }, [phase, sticker, tryInjectScene]);

  // When user clicks "Start AR" on preflight screen
  const startAR = useCallback(() => {
    if (aframeLoaded.current && mindARLoaded.current) {
      tryInjectScene();
    } else {
      // Scripts still loading – phase will advance to ar-init once they arrive
      setPhase("ar-init");
    }
  }, [tryInjectScene]);

  // Re-check injection after scripts load while in ar-init
  useEffect(() => {
    if (phase === "ar-init" && aframeLoaded.current && mindARLoaded.current) {
      tryInjectScene();
    }
  }, [phase, tryInjectScene]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const scene = document.getElementById("ar-scene") as (Element & { systems?: Record<string, { stop?: () => void }> }) | null;
      if (scene) {
        try {
          const mindarSystem = scene.systems?.["mindar-image-system"];
          mindarSystem?.stop?.();
        } catch {}
        scene.parentNode?.removeChild(scene);
      }
      const video = document.getElementById("ar-video") as HTMLVideoElement | null;
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
      if (sceneContainerRef.current) {
        sceneContainerRef.current.innerHTML = "";
      }
      sceneInjected.current = false;
      // Remove dynamically loaded scripts from <head>
      document.getElementById("mindar-script")?.remove();
      document.getElementById("aframe-script")?.remove();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === "https-required") {
    return <CameraPermissionFallback reason="https" />;
  }

  if (phase === "camera-denied") {
    return <CameraPermissionFallback reason="denied" onRetry={() => window.location.reload()} />;
  }

  if (phase === "unsupported") {
    return <CameraPermissionFallback reason="unsupported" />;
  }

  if (phase === "expired") {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-[2rem] p-10 neon-border text-center max-w-sm w-full space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic">Sticker Expired</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              This AR sticker has passed its expiry date.
            </p>
          </div>
          <Link href="/" className="flex items-center justify-center gap-2 text-sm font-bold text-primary uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Home
          </Link>
        </motion.div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2rem] p-10 neon-border text-center max-w-sm w-full space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic">Signal Lost</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{errorMsg}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Retry
            </button>
            <Link href="/" className="flex-1 h-11 rounded-xl glass border border-white/10 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
              Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Scripts are injected into <head> via useEffect — no <Script> tags here */}

      {/* Password modal */}
      <PasswordModal
        open={phase === "password"}
        error={pwError}
        onSubmit={handlePasswordSubmit}
      />

      {/* AR scene mount point */}
      <div ref={sceneContainerRef} className="fixed inset-0 z-20" />

      {/* ── Overlay UI ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {/* Loading */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background flex flex-col items-center justify-center z-30"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-6 animate-pulse">
              Initialising AR Engine…
            </p>
          </motion.div>
        )}

        {/* Preflight */}
        {phase === "preflight" && (
          <motion.div
            key="preflight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background flex items-center justify-center p-6 z-30"
          >
            <div className="text-center space-y-10 max-w-sm w-full">
              <div className="relative inline-block">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  className="absolute -inset-8 border border-primary/20 rounded-[3rem]"
                />
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-28 h-28 mx-auto rounded-[2.5rem] bg-primary/20 flex items-center justify-center border border-primary/30 relative"
                >
                  <Camera className="w-12 h-12 text-primary" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                </motion.div>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-black italic tracking-tight">Scanner Paused</h2>
                <p className="text-muted-foreground text-base leading-relaxed font-medium">
                  Tap below to restart the camera and scan your sticker.
                </p>
              </div>

              <button
                onClick={startAR}
                className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-xl tracking-[0.15em] uppercase shadow-[0_0_40px_rgba(73,109,219,0.4)] hover:shadow-[0_0_60px_rgba(73,109,219,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-4"
              >
                Restart Camera
              </button>

              <Link href="/scan" className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors block">
                Go Back
              </Link>
            </div>
          </motion.div>
        )}

        {/* AR init */}
        {phase === "ar-init" && (
          <motion.div
            key="ar-init"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-30 pointer-events-none"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white/60 text-xs uppercase tracking-widest font-bold mt-4">
              Loading AR Engine…
            </p>
          </motion.div>
        )}

        {/* AR active – show HUD */}
        {phase === "ar-active" && (
          <motion.div
            key="ar-hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-30 pointer-events-none"
          >
            {/* Top HUD */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
              <Link
                href="/"
                className="pointer-events-auto w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white border border-white/10 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="glass rounded-xl px-3 py-1.5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                AR ACTIVE • {id?.slice(0, 8)}
              </div>
            </div>

            {/* Scanning frames */}
            <AnimatePresence>
              {!targetDetected && (
                <motion.div
                  key="scan-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative w-64 h-64">
                    {/* Corner brackets */}
                    {[
                      "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
                      "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
                      "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
                      "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-10 h-10 border-primary ${cls}`} />
                    ))}
                    {/* Scan line */}
                    <motion.div
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_10px_rgba(73,109,219,0.8)]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom instruction */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 px-6">
              <motion.div
                animate={{ opacity: targetDetected ? 0 : 1 }}
                className="glass rounded-2xl px-6 py-3 border border-white/10 text-xs font-black uppercase tracking-widest text-white/70"
              >
                {targetDetected ? "Target Locked ✓" : "Point camera at your sticker"}
              </motion.div>
              <button
                onClick={() => {
                  const scene = document.getElementById("ar-scene") as (Element & { systems?: Record<string, { stop?: () => void }> }) | null;
                  if (scene) {
                    try { scene.systems?.["mindar-image-system"]?.stop?.(); } catch {}
                    scene.parentNode?.removeChild(scene);
                  }
                  setPhase("preflight");
                  sceneInjected.current = false;
                }}
                className="pointer-events-auto text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors"
              >
                Stop Scanner
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Utility: image aspect ratio ──────────────────────────────────────────────

function getImageAspectRatio(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
    img.onerror = reject;
    img.src = url;
  });
}

// ── Utility: wait for AFRAME global to be ready ───────────────────────────────
// A-Frame is loaded first via CDN, then MindAR is loaded dynamically.
// We poll for both AFRAME and MindAR to be ready before injecting the scene.
function waitForAFRAME(timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const win = window as Window & { AFRAME?: unknown; MINDAR?: unknown };
    const check = () => {
      // Check that AFRAME exists and has registerComponent (fully initialized)
      if (typeof win.AFRAME !== "undefined") {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error("AFRAME did not initialize within timeout"));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}


