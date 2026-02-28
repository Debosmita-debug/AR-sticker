'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { trackScan } from '@/lib/api';

export type ARStatus =
  | 'idle' |'loading' |'ready' |'scanning' |'detected' |'lost' |'error';

interface UseAROptions {
  stickerId: string;
  mindFileUrl: string;
  videoUrl: string;
  loop?: boolean;
}

export function useAR({ stickerId, mindFileUrl, videoUrl, loop = true }: UseAROptions) {
  const sceneRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mindarRef = useRef<any>(null);
  const [status, setStatus] = useState<ARStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const initAR = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setStatus('loading');

    try {
      // Wait for MindAR and A-Frame to be available on window
      let attempts = 0;
      while (!(window as any).MINDAR && attempts < 30) {
        await new Promise((r) => setTimeout(r, 300));
        attempts++;
      }
      if (!(window as any).MINDAR) {
        throw new Error('MindAR failed to load. Please check your connection and try again.');
      }

      const { MindARThree } = (window as any).MINDAR.IMAGE;
      const container = document.getElementById('ar-container');
      if (!container) throw new Error('AR container not found.');

      const mindar = new MindARThree({
        container,
        imageTargetSrc: mindFileUrl,
        maxTrack: 1,
        uiScanning: false,
        uiLoading: false,
      });
      mindarRef.current = mindar;

      const { renderer, scene, camera } = mindar;

      // Create video element lazily
      const video = document.createElement('video');
      video.src = videoUrl;
      video.loop = loop;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'none'; // Lazy load
      videoRef.current = video;

      const anchor = mindar.addAnchor(0);

      anchor.onTargetFound = () => {
        setStatus('detected');
        video.load();
        video.play().catch(() => {});
        trackScan(stickerId);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      };

      anchor.onTargetLost = () => {
        setStatus('lost');
        video.pause();
        setTimeout(() => setStatus('scanning'), 800);
      };

      await mindar.start();
      setStatus('scanning');

      // Render loop
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

    } catch (e: any) {
      setError(e.message || 'AR initialization failed.');
      setStatus('error');
    }
  }, [stickerId, mindFileUrl, videoUrl, loop]);

  const stopAR = useCallback(() => {
    if (mindarRef.current) {
      try { mindarRef.current.stop(); } catch {}
      mindarRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current = null;
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => { stopAR(); };
  }, [stopAR]);

  return { sceneRef, status, error, initAR, stopAR };
}