'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import Icon from '@/components/ui/Appicon';
import { getStickerData, trackScan, StickerData } from '@/lib/api';

interface ARViewerClientProps {
  stickerId: string;
  initialData?: StickerData | null;
}

type ViewerState = 'loading' | 'ready' | 'scanning' | 'detected' | 'error' | 'expired' | 'password';

export default function ARViewerClient({ stickerId, initialData }: ARViewerClientProps) {
  const [viewerState, setViewerState] = useState<ViewerState>(
    initialData ? 'ready' : 'loading'
  );
  const [stickerData, setStickerData] = useState<StickerData | null>(initialData || null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [scriptsReady, setScriptsReady] = useState(false);
  const [arStarted, setArStarted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasTrackedRef = useRef(false);

  // Check if expired
  const isExpired = useCallback((data: StickerData) => {
    if (!data.options.expiresAt) return false;
    return new Date(data.options.expiresAt) < new Date();
  }, []);

  // ── Fetch sticker data ────────────────────────────────
  const fetchData = useCallback(async (pwd?: string) => {
    try {
      const data = await getStickerData(stickerId, pwd);
      if (isExpired(data)) { setViewerState('expired'); return; }
      setStickerData(data);
      setViewerState('ready');
    } catch (e: any) {
      if (e.status === 401 || e.message?.toLowerCase().includes('password')) {
        setViewerState('password');
      } else {
        setError(e.message || 'Failed to load sticker data.');
        setViewerState('error');
      }
    }
  }, [stickerId, isExpired]);

  useEffect(() => {
    if (!initialData) fetchData();
    else if (isExpired(initialData)) setViewerState('expired');
  }, [initialData, fetchData, isExpired]);

  // ── Request camera permission ────────────────────────
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // Stop the stream - we just need permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      console.error('Camera permission error:', err);
      const message = 
        err.name === 'NotAllowedError' 
          ? 'Camera access was denied. Please enable it in your browser settings.' 
          : `Camera error: ${err.message}`;
      setError(message);
      setViewerState('error');
      return false;
    }
  }, []);

  // ── Start AR once scripts + data are ready ────────────
  const startAR = useCallback(async () => {
    if (!stickerData || !scriptsReady || arStarted) return;
    if (typeof window === 'undefined' || !(window as any).MINDAR?.IMAGE) return;

    // Request camera permission first
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const container = containerRef.current;
    if (!container) return;

    setArStarted(true);
    setViewerState('scanning');

    try {
      const { MindARThree } = (window as any).MINDAR.IMAGE;
      const { THREE } = (window as any);

      console.log('Initializing MindAR AR Viewer with:', stickerData.mindFileUrl);

      const mindar = new MindARThree({
        container,
        imageTargetSrc: stickerData.mindFileUrl,
        maxTrack: 1,
        uiScanning: false,
        uiLoading: false,
      });
      mindarRef.current = mindar;

      const { renderer, scene, camera } = mindar;

      // Video element with CORS support
      const video = document.createElement('video');
      video.loop = stickerData.options.loop !== false;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata'; // Preload metadata
      video.crossOrigin = 'anonymous'; // CORS for Cloudinary
      video.controls = false;
      
      // Video error handler
      video.addEventListener('error', (e) => {
        console.error('❌ Video loading error:', {
          error: e,
          src: video.src,
          networkState: video.networkState,
          readyState: video.readyState,
          errorCode: video.error?.code,
          errorMsg: video.error?.message,
        });
        setError(`Video failed to load: ${video.error?.message || 'Unknown error'}`);
      });

      video.addEventListener('canplay', () => {
        console.log('[Video] ✓ Can play');
      });

      videoRef.current = video;

      let videoTexture: any = null;
      let plane: any = null;

      const anchor = mindar.addAnchor(0);

      anchor.onTargetFound = () => {
        setViewerState('detected');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

        console.log('[AR] Target detected! Loading video:', stickerData.videoUrl);

        if (!videoTexture) {
          try {
            video.src = stickerData.videoUrl;
            
            video.addEventListener('loadedmetadata', () => {
              console.log('[Video] Metadata loaded:', { 
                duration: video.duration, 
                width: video.videoWidth, 
                height: video.videoHeight 
              });
            });

            video.load();
            console.log('[Video] Load() called for:', stickerData.videoUrl);

            videoTexture = new THREE.VideoTexture(video);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;

            // Match aspect ratio to image
            const aspectW = 1;
            const aspectH = 1; // Default 1:1; backend should provide aspect ratio
            const geo = new THREE.PlaneGeometry(aspectW, aspectH);
            const mat = new THREE.MeshBasicMaterial({
              map: videoTexture,
              transparent: true,
              opacity: 0,
              side: THREE.DoubleSide,
            });
            plane = new THREE.Mesh(geo, mat);
            anchor.group.add(plane);

            console.log('[AR] Video plane added to scene');

            // Fade in animation
            let opacity = 0;
            const fadeIn = () => {
              opacity = Math.min(1, opacity + 0.04);
              mat.opacity = opacity;
              if (opacity < 1) requestAnimationFrame(fadeIn);
            };
            requestAnimationFrame(fadeIn);

            // Play video
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('[Video] ✓ Playing');
                })
                .catch((error: any) => {
                  console.error('[Video] ✗ Play failed:', error);
                  setError(`Video play failed: ${error.message}`);
                });
            }
          } catch (err: any) {
            console.error('[Video] Setup error:', err);
            setError(`Video setup failed: ${err.message}`);
          }
        } else {
          // Video already loaded, just play
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((error: any) => {
              console.error('[Video] Play error:', error);
            });
          }
        }

        // Track scan once per session
        if (!hasTrackedRef.current) {
          hasTrackedRef.current = true;
          trackScan(stickerId);
        }
      };

      anchor.onTargetLost = () => {
        setViewerState('scanning');
        video.pause();
      };

      console.log('Starting MindAR...');
      await mindar.start();
      console.log('MindAR started successfully');

      renderer.setAnimationLoop(() => {
        if (videoTexture) videoTexture.needsUpdate = true;
        renderer.render(scene, camera);
      });

    } catch (e: any) {
      console.error('AR initialization error:', e);
      setError(e.message || 'AR initialization failed.');
      setViewerState('error');
      setArStarted(false);
    }
  }, [stickerData, scriptsReady, arStarted, stickerId, requestCameraPermission]);

  useEffect(() => {
    if (viewerState === 'ready' && scriptsReady && !arStarted) {
      startAR();
    }
  }, [viewerState, scriptsReady, arStarted, startAR]);

  useEffect(() => {
    return () => {
      if (mindarRef.current) {
        try { mindarRef.current.stop(); } catch {}
        mindarRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current = null;
      }
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setPasswordError('Please enter a password.'); return; }
    setPasswordError('');
    await fetchData(password);
  };

  // ── Monitor script loading ─────────────────────────
  useEffect(() => {
    const checkLibraries = () => {
      const hasAFrame = typeof (window as any).AFRAME !== 'undefined';
      const hasMindAR = typeof (window as any).MINDAR !== 'undefined';
      const hasTHREE = typeof (window as any).THREE !== 'undefined';

      console.log('Library check:', {
        THREE: hasTHREE,
        AFRAME: hasAFrame,
        MINDAR: hasMindAR,
        MINDAR_IMAGE: hasMindAR ? typeof (window as any).MINDAR.IMAGE !== 'undefined' : false
      });

      // Check if MINDAR is properly configured
      if (hasMindAR && !(window as any).MINDAR.IMAGE) {
        console.warn('MINDAR loaded but IMAGE module not found');
        return;
      }

      if (hasTHREE && hasMindAR && !scriptsReady) {
        console.log('Required libraries ready, setting scriptsReady=true');
        setScriptsReady(true);
      }
    };

    checkLibraries();
    const interval = setInterval(checkLibraries, 300);

    const timeout = setTimeout(() => {
      if (!scriptsReady) {
        console.error('Timeout: scripts did not load after 30 seconds');
        setError('Failed to load required libraries. Check your internet connection.');
        setViewerState('error');
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scriptsReady]);

  // ─────────────────────────────────────────────────────
  return (
    <>
      {/* THREE.js (required by MindAR) */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        strategy="afterInteractive"
        onLoad={() => console.log('THREE.js loaded')}
        onError={() => console.error('Failed to load THREE.js')}
      />

      {/* A-Frame (optional for AR) */}
      <Script
        src="https://aframe.io/releases/1.4.0/aframe.min.js"
        strategy="afterInteractive"
        onLoad={() => console.log('A-Frame loaded')}
        onError={() => console.error('Failed to load A-Frame')}
      />

      {/* MindAR ImageTarget - primary */}
      <Script
        src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-three.prod.js"
        strategy="afterInteractive"
        onLoad={() => console.log('MindAR loaded from jsdelivr')}
        onError={() => {
          console.error('Failed to load MindAR from jsdelivr, trying unpkg...');
          // Fallback to unpkg if jsdelivr fails
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/mind-ar@1.2.2/dist/mindar-image-three.prod.js';
          script.onload = () => console.log('MindAR loaded from unpkg fallback');
          script.onerror = () => {
            console.error('All MindAR CDNs failed');
            setError('Failed to load MindAR library. Try refreshing the page.');
            setViewerState('error');
          };
          document.head.appendChild(script);
        }}
      />

      {/* AR Render Container */}
      <div
        ref={containerRef}
        className="fixed inset-0 w-screen h-screen bg-black"
        style={{ zIndex: 9990 }}
        aria-label="AR experience viewport"
      />

      {/* ── Loading ── */}
      {viewerState === 'loading' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[#0A0B14]">
          <div className="text-center space-y-5">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AFF] animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#00D4FF]" style={{ animation: 'spin-reverse 1.5s linear infinite' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="CubeTransparentIcon" size={20} className="text-[#7C3AFF]" />
              </div>
            </div>
            <p className="text-[#8B91B8] text-sm font-medium">Loading AR Experience…</p>
          </div>
        </div>
      )}

      {/* ── Ready / Initializing AR ── */}
      {viewerState === 'ready' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[rgba(10,11,20,0.9)]">
          <div className="text-center space-y-5 max-w-xs px-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AFF] animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#00D4FF]" style={{ animation: 'spin-reverse 1.5s linear infinite' }} />
            </div>
            <p className="text-[#F0F2FF] font-semibold">Starting AR…</p>
            <p className="text-[#4A5080] text-xs">Requesting camera and preparing target detection</p>
          </div>
        </div>
      )}

      {/* ── Password ── */}
      {viewerState === 'password' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[rgba(10,11,20,0.97)] px-6">
          <div className="max-w-sm w-full space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(124,58,255,0.1)] border border-[rgba(124,58,255,0.3)] flex items-center justify-center mx-auto mb-4">
                <Icon name="LockClosedIcon" size={28} className="text-[#7C3AFF]" />
              </div>
              <h2 className="font-heading font-bold text-xl text-[#F0F2FF]">Password Required</h2>
              <p className="text-[#8B91B8] text-sm mt-2">Enter the password to unlock this AR experience.</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                className="input-field w-full px-4 py-3 text-sm"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                aria-label="AR experience password"
              />
              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
              <button type="submit" className="btn-primary w-full py-3 text-sm rounded-btn flex items-center justify-center gap-2">
                <Icon name="LockOpenIcon" size={15} />
                Unlock Experience
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Expired ── */}
      {viewerState === 'expired' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[#0A0B14] px-6">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] flex items-center justify-center mx-auto">
              <Icon name="ClockIcon" size={28} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-[#F0F2FF]">Experience Expired</h2>
              <p className="text-[#8B91B8] text-sm mt-2">This AR sticker has expired and is no longer available.</p>
            </div>
            <Link href="/upload-creation" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-btn">
              <Icon name="PlusCircleIcon" size={15} />
              Create Your Own Sticker
            </Link>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {viewerState === 'error' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[#0A0B14] px-6">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] flex items-center justify-center mx-auto">
              <Icon name="ExclamationTriangleIcon" size={28} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-[#F0F2FF]">Failed to Load</h2>
              <p className="text-[#8B91B8] text-sm mt-2">{error || 'Something went wrong.'}</p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto w-full">
              <button
                onClick={() => { setViewerState('loading'); setArStarted(false); fetchData(); }}
                className="btn-primary py-3 text-sm rounded-btn flex items-center justify-center gap-2"
              >
                <Icon name="ArrowPathIcon" size={15} />
                Retry
              </button>
              <Link href="/upload-creation" className="btn-secondary py-3 text-sm rounded-btn flex items-center justify-center gap-2">
                <Icon name="HomeIcon" size={15} />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Scanning / Detected UI ── */}
      {(viewerState === 'scanning' || viewerState === 'detected') && (
        <div className="fixed inset-0 z-[9994] pointer-events-none">
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent animate-scan opacity-60"
            aria-hidden="true"
          />

          {/* Reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-52 h-52">
              <div className="target-finder-corner tl animate-corner-pulse" />
              <div className="target-finder-corner tr animate-corner-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="target-finder-corner bl animate-corner-pulse" style={{ animationDelay: '0.6s' }} />
              <div className="target-finder-corner br animate-corner-pulse" style={{ animationDelay: '0.9s' }} />

              {viewerState === 'detected' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[rgba(0,212,255,0.15)] flex items-center justify-center">
                      <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-[#00D4FF]" />
                    </div>
                    <span className="absolute inset-0 rounded-full animate-pulse-ring bg-[rgba(0,212,255,0.25)]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Caption / instruction */}
          <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 pointer-events-auto flex flex-col items-center gap-3">
            <div className="glass rounded-2xl px-5 py-3 text-center border border-[rgba(0,212,255,0.2)] max-w-xs">
              {viewerState === 'scanning' ? (
                <p className="text-sm font-medium text-[#F0F2FF]">
                  <span className="text-[#00D4FF] animate-blink inline-block">●</span>{' '}
                  Point camera at your sticker
                </p>
              ) : (
                <p className="text-sm font-semibold text-[#00D4FF]">
                  ✓ {stickerData?.options.caption || 'AR active — hold steady!'}
                </p>
              )}
            </div>

            <Link
              href="/upload-creation"
              className="glass flex items-center gap-2 px-4 py-2 rounded-full text-xs text-[#8B91B8] hover:text-white transition-colors border border-[rgba(255,255,255,0.05)]"
            >
              <Icon name="XMarkIcon" size={13} />
              Exit
            </Link>
          </div>

          {/* Top bar */}
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <div className="glass flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(124,58,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AFF] animate-blink" />
              <span className="text-xs font-mono text-[#8B91B8]">ARStickerHub</span>
              <span className="text-[#4A5080]">·</span>
              <span className="text-xs font-mono text-[#4A5080]">
                {viewerState === 'detected' ? '🟢 Live' : '🔵 Scanning'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* noscript */}
      <noscript>
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0A0B14] p-6">
          <div className="text-center max-w-sm">
            <h2 className="font-heading font-bold text-xl text-[#F0F2FF] mb-3">JavaScript Required</h2>
            <p className="text-[#8B91B8] text-sm">Enable JavaScript to view this AR experience.</p>
          </div>
        </div>
      </noscript>
    </>
  );
}