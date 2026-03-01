"use client";

/**
 * /scan – Universal AR Scanner
 *
 * Opens the camera immediately and recognises ANY sticker uploaded to the
 * platform.  When a sticker is detected the matching video is overlaid on
 * top of the physical image in real-time.
 *
 * How it works:
 *   1. Fetch GET /api/scan/universal → combined .mind URL + target mapping
 *   2. Inject A-Frame 1.4.2 + MindAR 1.2.5 CDN scripts into <head>
 *   3. Build an <a-scene> with one <a-entity mindar-image-target> per target
 *   4. On targetFound  → dynamically create a <video> element, assign to plane, play
 *   5. On targetLost   → pause the video
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Camera,
  Loader2,
  ChevronLeft,
  WifiOff,
  ScanLine,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  getUniversalTargets,
  trackScan,
  type UniversalTarget,
} from "@/lib/api";
import CameraPermissionFallback from "@/components/CameraPermissionFallback";

type Phase =
  | "loading"
  | "empty"
  | "ar-init"
  | "ar-active"
  | "error"
  | "camera-denied"
  | "https-required";

export default function UniversalScannerPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [targets, setTargets] = useState<UniversalTarget[]>([]);
  const [mindUrl, setMindUrl] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<UniversalTarget | null>(null);
  const [muted, setMuted] = useState(false);

  // Refs
  const aframeLoaded = useRef(false);
  const mindARLoaded = useRef(false);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneInjected = useRef(false);
  const trackedIds = useRef<Set<string>>(new Set());

  // ── HTTPS check ───────────────────────────────────────────────────────────
  useEffect(() => {
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isSecure) setPhase("https-required");
  }, []);

  // ── Load A-Frame + MindAR scripts into <head> ────────────────────────────
  useEffect(() => {
    if (document.getElementById("aframe-script")) {
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

      const mindarScript = document.createElement("script");
      mindarScript.id = "mindar-script";
      mindarScript.src =
        "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js";
      mindarScript.onload = () => {
        mindARLoaded.current = true;
        // If data is already loaded, try injecting
        tryInjectScene();
      };
      document.head.appendChild(mindarScript);
    };
    document.head.appendChild(aframeScript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch universal targets ───────────────────────────────────────────────
  useEffect(() => {
    if (phase === "https-required") return;

    getUniversalTargets()
      .then((data) => {
        if (!data.mindFileUrl || data.targets.length === 0) {
          setPhase("empty");
          return;
        }
        setMindUrl(data.mindFileUrl);
        setTargets(data.targets);
        setPhase("ar-init");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message || "Failed to load scanner data");
        setPhase("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scene injection ───────────────────────────────────────────────────────
  const tryInjectScene = useCallback(async () => {
    if (
      !aframeLoaded.current ||
      !mindARLoaded.current ||
      !mindUrl ||
      targets.length === 0 ||
      sceneInjected.current ||
      !sceneContainerRef.current
    ) return;

    sceneInjected.current = true;

    // Wait for AFRAME global
    await waitForAFRAME();

    // Build entity HTML for every target
    const entitiesHTML = targets
      .map(
        (t) => `
  <a-entity mindar-image-target="targetIndex: ${t.targetIndex}" id="target-${t.targetIndex}">
    <a-plane
      id="plane-${t.targetIndex}"
      position="0 0 0"
      width="1"
      height="0.5625"
      rotation="0 0 0"
      material="shader: flat; side: double; transparent: true; opacity: 0"
    ></a-plane>
  </a-entity>`
      )
      .join("\n");

    const sceneHTML = /* html */ `
<a-scene
  id="ar-scene"
  mindar-image="imageTargetSrc: ${mindUrl}; autoStart: true; uiLoading: no; uiScanning: no; uiError: no; maxTrack: 1;"
  color-space="sRGB"
  renderer="colorManagement: true; physicallyCorrectLights: true"
  vr-mode-ui="enabled: false"
  device-orientation-permission-ui="enabled: false"
  style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:20;"
>
  <a-assets timeout="30000"></a-assets>
  <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
  ${entitiesHTML}
</a-scene>`;

    sceneContainerRef.current.innerHTML = sceneHTML;

    const scene = sceneContainerRef.current.querySelector("#ar-scene") as
      | (Element & { systems?: Record<string, { stop?: () => void }> })
      | null;
    if (!scene) return;

    scene.addEventListener("arReady", () => {
      setPhase("ar-active");
    });

    scene.addEventListener("arError", () => {
      setErrorMsg("AR initialisation failed. Check camera permissions.");
      setPhase("error");
    });

    // Wire targetFound / targetLost for every target entity
    targets.forEach((t) => {
      const entity = scene.querySelector(`#target-${t.targetIndex}`);
      if (!entity) return;

      entity.addEventListener("targetFound", () => {
        setActiveTarget(t);
        navigator.vibrate?.(100);

        // Track scan once per sticker per session
        if (!trackedIds.current.has(t.stickerId)) {
          trackedIds.current.add(t.stickerId);
          trackScan(t.stickerId).catch(() => {});
        }

        // Dynamically load video for this target
        let video = document.getElementById(
          `video-${t.targetIndex}`
        ) as HTMLVideoElement | null;

        if (!video) {
          video = document.createElement("video");
          video.id = `video-${t.targetIndex}`;
          video.setAttribute("crossorigin", "anonymous");
          video.setAttribute("playsinline", "");
          video.setAttribute("webkit-playsinline", "");
          video.preload = "auto";
          if (t.options.loop) video.loop = true;
          video.src = t.videoUrl;
          document.querySelector("#ar-scene a-assets")?.appendChild(video);
        }

        // Assign video to the plane
        const plane = scene.querySelector(`#plane-${t.targetIndex}`) as any;
        if (plane) {
          plane.setAttribute("material", "src", `#video-${t.targetIndex}`);
          plane.setAttribute("material", "opacity", "1");
        }

        // Play
        video.muted = false;
        video.play().catch(() => {
          video!.muted = true;
          video!.play().catch(() => {});
        });
      });

      entity.addEventListener("targetLost", () => {
        setActiveTarget((prev) =>
          prev?.targetIndex === t.targetIndex ? null : prev
        );

        const video = document.getElementById(
          `video-${t.targetIndex}`
        ) as HTMLVideoElement | null;
        if (video) video.pause();

        // Hide the plane
        const plane = scene.querySelector(`#plane-${t.targetIndex}`) as any;
        if (plane) {
          plane.setAttribute("material", "opacity", "0");
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mindUrl, targets]);

  // Trigger scene injection when both scripts + data are ready
  useEffect(() => {
    if (
      phase === "ar-init" &&
      aframeLoaded.current &&
      mindARLoaded.current &&
      mindUrl
    ) {
      tryInjectScene();
    }
  }, [phase, mindUrl, tryInjectScene]);

  // ── Mute / unmute ─────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      targets.forEach((t) => {
        const v = document.getElementById(
          `video-${t.targetIndex}`
        ) as HTMLVideoElement | null;
        if (v) v.muted = next;
      });
      return next;
    });
  }, [targets]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const scene = document.getElementById("ar-scene") as
        | (Element & { systems?: Record<string, { stop?: () => void }> })
        | null;
      if (scene) {
        try {
          scene.systems?.["mindar-image-system"]?.stop?.();
        } catch {}
        scene.parentNode?.removeChild(scene);
      }
      targets.forEach((t) => {
        const v = document.getElementById(
          `video-${t.targetIndex}`
        ) as HTMLVideoElement | null;
        if (v) {
          v.pause();
          v.src = "";
          v.load();
        }
      });
      if (sceneContainerRef.current) {
        sceneContainerRef.current.innerHTML = "";
      }
      sceneInjected.current = false;
      document.getElementById("mindar-script")?.remove();
      document.getElementById("aframe-script")?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === "https-required") {
    return <CameraPermissionFallback reason="https" />;
  }

  if (phase === "camera-denied") {
    return (
      <CameraPermissionFallback
        reason="denied"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (phase === "empty") {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-[2rem] p-10 neon-border text-center max-w-sm w-full space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <ScanLine className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic">No Stickers Yet</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              There are no active stickers to scan. Create one first!
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
          >
            Create a Sticker
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
            <h2 className="text-2xl font-black italic">Something Went Wrong</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {errorMsg}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Retry
            </button>
            <Link
              href="/"
              className="flex-1 h-11 rounded-xl glass border border-white/10 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
            >
              Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* AR scene mount point */}
      <div ref={sceneContainerRef} className="fixed inset-0 z-20" />

      {/* ── Overlay UI ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {/* Loading data */}
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
              Preparing Universal Scanner…
            </p>
          </motion.div>
        )}

        {/* AR init - scripts loading */}
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
            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-2">
              {targets.length} sticker{targets.length !== 1 ? "s" : ""} loaded
            </p>
          </motion.div>
        )}

        {/* AR active – HUD */}
        {phase === "ar-active" && (
          <motion.div
            key="ar-hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-30 pointer-events-none"
          >
            {/* Top bar */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
              <Link
                href="/"
                className="pointer-events-auto w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white border border-white/10 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="pointer-events-auto w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white border border-white/10 transition-all"
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="glass rounded-xl px-3 py-1.5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                  Universal Scanner
                </div>
              </div>
            </div>

            {/* Scanning reticle */}
            <AnimatePresence>
              {!activeTarget && (
                <motion.div
                  key="scan-reticle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative w-64 h-64">
                    {[
                      "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
                      "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
                      "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
                      "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute w-10 h-10 border-primary ${cls}`}
                      />
                    ))}
                    <motion.div
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                      }}
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_10px_rgba(73,109,219,0.8)]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom info */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 px-6">
              {activeTarget ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl px-6 py-3 border border-primary/30 text-xs font-black uppercase tracking-widest text-primary"
                >
                  {activeTarget.options.caption
                    ? `✓ ${activeTarget.options.caption}`
                    : "✓ Target Detected"}
                </motion.div>
              ) : (
                <div className="glass rounded-2xl px-6 py-3 border border-white/10 text-xs font-black uppercase tracking-widest text-white/70">
                  Point camera at any sticker
                </div>
              )}

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                {targets.length} sticker{targets.length !== 1 ? "s" : ""}{" "}
                registered
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Utility ──────────────────────────────────────────────────────────────────

function waitForAFRAME(timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const win = window as Window & { AFRAME?: unknown };
    const check = () => {
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
