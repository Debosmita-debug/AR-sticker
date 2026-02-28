'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import Icon from '@/components/ui/Appicon';
import { getStickerData, trackScan } from '@/lib/api';

type ScannerState =
  | 'permission'
  | 'loading_scripts'
  | 'loading_ar'
  | 'scanning'
  | 'detected'
  | 'lost'
  | 'error'
  | 'password'
  | 'expired';

export default function ARScannerClient() {
  const searchParams = useSearchParams();
  const stickerId = searchParams?.get('id') || '';

  const [state, setState] = useState<ScannerState>('permission');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [caption, setCaption] = useState('');
  const [isHttpWarning] = useState(
    typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost'
  );

  const mindarRef = useRef<any>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickerDataRef = useRef<any>(null);

  // ── Request camera permission ────────────────────────
  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // Stop the stream immediately - we just need permission
      stream.getTracks().forEach(track => track.stop());
      setState('loading_scripts');
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError' 
          ? 'Camera access was denied. Please check your browser settings and try again.' 
          : `Camera error: ${err.message || 'Please enable camera access'}`
      );
      setState('error');
    }
  }, []);

  // Auto-request camera on mount
  useEffect(() => {
    if (state === 'permission') {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        requestCamera();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, requestCamera]);

  // ── Initialize MindAR once scripts are ready ─────────
  const initMindAR = useCallback(async (pwd?: string) => {
    if (typeof window === 'undefined') return;
    if (!(window as any).MINDAR?.IMAGE || !(window as any).THREE) {
      setErrorMsg('MindAR or THREE.js failed to load. Check your connection and try again.');
      setState('error');
      return;
    }

    setState('loading_ar');

    try {
      // Fetch sticker data
      const data = await getStickerData(stickerId || 'demo', pwd);
      stickerDataRef.current = data;

      // Check expiry
      if (data.options.expiresAt && new Date(data.options.expiresAt) < new Date()) {
        setState('expired');
        return;
      }

      if (data.options.caption) setCaption(data.options.caption);

      const container = containerRef.current;
      if (!container) {
        throw new Error('AR container not found in DOM');
      }

      const { MindARThree } = (window as any).MINDAR.IMAGE;
      const { THREE } = (window as any);

      console.log('Initializing MindAR with image target:', data.mindFileUrl);

      const mindar = new MindARThree({
        container,
        imageTargetSrc: data.mindFileUrl,
        maxTrack: 1,
        uiScanning: false,
        uiLoading: false,
      });
      mindarRef.current = mindar;

      const { renderer, scene, camera } = mindar;

      // Create video element (lazy — don't load src yet)
      const video = document.createElement('video');
      video.loop = data.options.loop !== false;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'none';
      videoElRef.current = video;

      // Create video texture plane
      let texture: any = null;
      let videoPlane: any = null;

      const anchor = mindar.addAnchor(0);

      anchor.onTargetFound = () => {
        setState('detected');
        trackScan(stickerId || 'demo');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

        // Lazy load video on first detection
        if (!texture) {
          video.src = data.videoUrl;
          video.load();
          texture = new THREE.VideoTexture(video);
          texture.minFilter = THREE.LinearFilter;
          const aspect = 16 / 9;
          const geo = new THREE.PlaneGeometry(1, 1 / aspect);
          const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0 });
          videoPlane = new THREE.Mesh(geo, mat);
          anchor.group.add(videoPlane);

          // Fade in
          let opacity = 0;
          const fadeIn = () => {
            opacity = Math.min(1, opacity + 0.05);
            mat.opacity = opacity;
            if (opacity < 1) requestAnimationFrame(fadeIn);
          };
          requestAnimationFrame(fadeIn);
        }

        video.play().catch((e) => console.warn('Video play error:', e));
      };

      anchor.onTargetLost = () => {
        setState('lost');
        video.pause();
      };

      console.log('Starting MindAR...');
      await mindar.start();
      console.log('MindAR started successfully');
      setState('scanning');

      renderer.setAnimationLoop(() => {
        if (texture) texture.needsUpdate = true;
        renderer.render(scene, camera);
      });

    } catch (e: any) {
      console.error('MindAR initialization error:', e);
      if (e.status === 401 || e.message?.includes('password')) {
        setState('password');
      } else if (e.message?.includes('expired')) {
        setState('expired');
      } else {
        setErrorMsg(e.message || 'Failed to initialize AR. Please try again.');
        setState('error');
      }
    }
  }, [stickerId]);

  // ── When scripts finish loading ──────────────────────
  useEffect(() => {
    if (scriptsLoaded && state === 'loading_scripts') {
      // Small delay to ensure window globals are ready
      setTimeout(() => initMindAR(), 400);
    }
  }, [scriptsLoaded, state, initMindAR]);

  // ── Cleanup on unmount ───────────────────────────────
  useEffect(() => {
    return () => {
      if (mindarRef.current) {
        try { mindarRef.current.stop(); } catch {}
        mindarRef.current = null;
      }
      if (videoElRef.current) {
        videoElRef.current.pause();
        videoElRef.current.src = '';
        videoElRef.current = null;
      }
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setPasswordError('Please enter the password.'); return; }
    setPasswordError('');
    setState('loading_scripts');
    await initMindAR(password);
  };

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────

  // Check for library loading
  useEffect(() => {
    const checkLibraries = () => {
      const hasAFrame = typeof (window as any).AFRAME !== 'undefined';
      const hasMindAR = typeof (window as any).MINDAR !== 'undefined';
      const hasTHREE = typeof (window as any).THREE !== 'undefined';

      console.log('Library check:', {
        AFRAME: hasAFrame,
        MINDAR: hasMindAR,
        THREE: hasTHREE,
        state: state
      });

      // Check if MINDAR is properly configured
      if (hasMindAR && !(window as any).MINDAR.IMAGE) {
        console.warn('MINDAR loaded but IMAGE module not found');
        return;
      }

      if (hasAFrame && hasMindAR && hasTHREE && state === 'loading_scripts') {
        console.log('All libraries ready, setting scriptsLoaded=true');
        setScriptsLoaded(true);
      }
    };

    // Check immediately
    checkLibraries();
    const interval = setInterval(checkLibraries, 300);

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      if (state === 'loading_scripts' && !scriptsLoaded) {
        console.error('Script loading timeout');
        setErrorMsg('Script loading timed out. Check your internet connection.');
        setState('error');
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [state, scriptsLoaded]);

  return (
    <>
      {/* THREE.js (required by MindAR) */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        strategy="afterInteractive"
        onLoad={() => console.log('THREE.js loaded')}
        onError={() => console.error('Failed to load THREE.js')}
      />

      {/* A-Frame (optional, for basic AR) */}
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
            setErrorMsg('Failed to load MindAR library. Try refreshing the page.');
            setState('error');
          };
          document.head.appendChild(script);
        }}
      />

      {/* HTTP Warning Banner */}
      {isHttpWarning && (
        <div className="fixed top-0 left-0 right-0 z-[10001] bg-amber-500 text-black px-4 py-2 text-xs font-semibold text-center">
          ⚠️ Camera AR requires HTTPS. This page is served over HTTP — camera may not work.
        </div>
      )}

      {/* ── AR Container ── */}
      <div
        ref={containerRef}
        id="ar-container"
        className="fixed inset-0 w-screen h-screen bg-black"
        style={{ zIndex: 9990 }}
        aria-label="AR camera view"
      />

      {/* ── Permission Screen ── */}
      {state === 'permission' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[#0A0B14] grid-bg px-6">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-2xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center mx-auto">
                <Icon name="CameraIcon" size={36} className="text-[#00D4FF]" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#7C3AFF] flex items-center justify-center">
                <Icon name="LockOpenIcon" size={12} className="text-white" />
              </span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl text-[#F0F2FF] mb-2">Camera Access Needed</h1>
              <p className="text-[#8B91B8] text-sm leading-relaxed">
                ARStickerHub needs your camera to scan and detect AR target images. Your video is never recorded or stored.
              </p>
            </div>
            <button
              onClick={requestCamera}
              className="btn-primary w-full py-4 text-sm rounded-btn flex items-center justify-center gap-2"
            >
              <Icon name="CameraIcon" size={16} />
              Allow Camera & Start Scanning
            </button>
            <Link href="/upload-creation" className="text-xs text-[#4A5080] hover:text-[#8B91B8] transition-colors underline underline-offset-2">
              ← Back to Create
            </Link>
          </div>
        </div>
      )}

      {/* ── Loading Screen ── */}
      {(state === 'loading_scripts' || state === 'loading_ar') && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[rgba(10,11,20,0.95)] px-6">
          <div className="text-center space-y-6">
            {/* Orbital spinner */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-[rgba(124,58,255,0.15)]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AFF] animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#00D4FF] animate-spin-reverse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="CubeTransparentIcon" size={22} className="text-[#7C3AFF]" />
              </div>
            </div>
            <div>
              <p className="font-heading font-semibold text-[#F0F2FF]">
                {state === 'loading_scripts' ? 'Loading AR Engine…' : 'Initializing Scanner…'}
              </p>
              <p className="text-xs text-[#4A5080] mt-1">
                {state === 'loading_scripts' ? 'Downloading MindAR & A-Frame' : 'Preparing image target detection'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Password Prompt ── */}
      {state === 'password' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[rgba(10,11,20,0.97)] px-6">
          <div className="max-w-sm w-full space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(124,58,255,0.1)] border border-[rgba(124,58,255,0.3)] flex items-center justify-center mx-auto mb-4">
                <Icon name="LockClosedIcon" size={28} className="text-[#7C3AFF]" />
              </div>
              <h2 className="font-heading font-bold text-xl text-[#F0F2FF]">Password Protected</h2>
              <p className="text-[#8B91B8] text-sm mt-2">This AR sticker requires a password to unlock.</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  className="input-field w-full px-4 py-3 text-sm"
                  placeholder="Enter sticker password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  aria-label="Sticker password"
                />
                {passwordError && (
                  <p className="text-red-400 text-xs mt-1.5">{passwordError}</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-sm rounded-btn flex items-center justify-center gap-2">
                <Icon name="LockOpenIcon" size={15} />
                Unlock & Start Scanning
              </button>
            </form>
            <Link href="/upload-creation" className="block text-center text-xs text-[#4A5080] hover:text-[#8B91B8] transition-colors">
              ← Go back
            </Link>
          </div>
        </div>
      )}

      {/* ── Expired Screen ── */}
      {state === 'expired' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[#0A0B14] px-6">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] flex items-center justify-center mx-auto">
              <Icon name="ClockIcon" size={28} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-[#F0F2FF]">Sticker Expired</h2>
              <p className="text-[#8B91B8] text-sm mt-2">This AR sticker has passed its expiry date and is no longer available.</p>
            </div>
            <Link href="/upload-creation" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-btn">
              <Icon name="PlusCircleIcon" size={15} />
              Create a New Sticker
            </Link>
          </div>
        </div>
      )}

      {/* ── Error Screen ── */}
      {state === 'error' && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-[#0A0B14] px-6">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] flex items-center justify-center mx-auto">
              <Icon name="ExclamationTriangleIcon" size={28} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-[#F0F2FF]">AR Error</h2>
              <p className="text-[#8B91B8] text-sm mt-2">{errorMsg || 'Something went wrong. Please try again.'}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setState('permission'); setErrorMsg(''); }}
                className="btn-primary py-3 text-sm rounded-btn flex items-center justify-center gap-2"
              >
                <Icon name="ArrowPathIcon" size={15} />
                Try Again
              </button>
              <Link href="/upload-creation" className="btn-secondary py-3 text-sm rounded-btn flex items-center justify-center gap-2">
                <Icon name="HomeIcon" size={15} />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Scanning UI Overlay ── */}
      {(state === 'scanning' || state === 'detected' || state === 'lost') && (
        <div className="fixed inset-0 z-[9994] pointer-events-none">
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent animate-scan opacity-70"
            aria-hidden="true"
          />

          {/* Target finder reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-56 h-56">
              <div className="target-finder-corner tl animate-corner-pulse" />
              <div className="target-finder-corner tr animate-corner-pulse" style={{ animationDelay: '0.25s' }} />
              <div className="target-finder-corner bl animate-corner-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="target-finder-corner br animate-corner-pulse" style={{ animationDelay: '0.75s' }} />

              {state === 'detected' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[rgba(0,212,255,0.2)] flex items-center justify-center">
                      <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-[#00D4FF]" />
                    </div>
                    <span className="absolute inset-0 rounded-full bg-[rgba(0,212,255,0.3)] animate-pulse-ring" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom instruction bar */}
          <div className="absolute bottom-0 left-0 right-0 pb-8 px-6 pointer-events-auto">
            <div className="max-w-xs mx-auto glass rounded-2xl px-5 py-3 text-center border border-[rgba(0,212,255,0.2)]">
              {state === 'scanning' && (
                <p className="text-sm font-medium text-[#F0F2FF]">
                  <span className="text-[#00D4FF]">●</span>{' '}
                  Point camera at your sticker
                </p>
              )}
              {state === 'detected' && (
                <p className="text-sm font-semibold text-[#00D4FF]">
                  ✓ Sticker detected!{caption ? ` ${caption}` : ''}
                </p>
              )}
              {state === 'lost' && (
                <p className="text-sm font-medium text-[#8B91B8]">Target lost — keep scanning…</p>
              )}
            </div>

            {/* Close button */}
            <div className="flex justify-center mt-3">
              <Link
                href="/upload-creation"
                className="glass flex items-center gap-2 px-4 py-2 rounded-full text-xs text-[#8B91B8] hover:text-white transition-colors border border-[rgba(255,255,255,0.05)]"
              >
                <Icon name="XMarkIcon" size={13} />
                Exit Scanner
              </Link>
            </div>
          </div>

          {/* Top status bar */}
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <div className="glass flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(124,58,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AFF] animate-blink" />
              <span className="text-xs font-mono text-[#8B91B8]">ARStickerHub</span>
              {stickerId && (
                <>
                  <span className="text-[#4A5080]">·</span>
                  <span className="text-xs font-mono text-[#4A5080]">#{stickerId.slice(0, 8)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* noscript fallback */}
      <noscript>
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0A0B14] p-6">
          <div className="text-center max-w-sm">
            <h2 className="font-heading font-bold text-xl text-[#F0F2FF] mb-3">JavaScript Required</h2>
            <p className="text-[#8B91B8] text-sm">
              The AR scanner requires JavaScript to run. Please enable JavaScript in your browser settings.
            </p>
          </div>
        </div>
      </noscript>
    </>
  );
}