'use client';

import { useState, useCallback } from 'react';
import { uploadSticker, UploadResponse } from '@/lib/api';

export interface UploadOptions {
  loop: boolean;
  caption: string;
  password: string;
  expiryDays: string;
}

export interface UploadState {
  imageFile: File | null;
  videoFile: File | null;
  imagePreview: string | null;
  videoPreview: string | null;
  progress: number;
  uploading: boolean;
  result: UploadResponse | null;
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    imageFile: null,
    videoFile: null,
    imagePreview: null,
    videoPreview: null,
    progress: 0,
    uploading: false,
    result: null,
    error: null,
  });

  const [options, setOptions] = useState<UploadOptions>({
    loop: true,
    caption: '',
    password: '',
    expiryDays: '30',
  });

  // Compress image using Canvas API (max 1500px wide)
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const MAX_W = 1500;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width <= MAX_W) { resolve(file); return; }
        const ratio = MAX_W / img.width;
        const canvas = document.createElement('canvas');
        canvas.width = MAX_W;
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }, []);

  const validateFile = useCallback((file: File, type: 'image' | 'video'): string | null => {
    if (type === 'image') {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
        return 'Only JPG, PNG, or WebP images are accepted.';
      if (file.size > 15 * 1024 * 1024) return 'Image must be under 15 MB.';
    } else {
      if (!['video/mp4', 'video/webm'].includes(file.type))
        return 'Only MP4 or WebM videos are accepted.';
      if (file.size > 100 * 1024 * 1024) return 'Video must be under 100 MB.';
    }
    return null;
  }, []);

  const setImageFile = useCallback(async (file: File) => {
    const err = validateFile(file, 'image');
    if (err) { setState((s) => ({ ...s, error: err })); return; }
    const compressed = await compressImage(file);
    const preview = URL.createObjectURL(compressed);
    setState((s) => ({ ...s, imageFile: compressed, imagePreview: preview, error: null }));
  }, [validateFile, compressImage]);

  const setVideoFile = useCallback((file: File) => {
    const err = validateFile(file, 'video');
    if (err) { setState((s) => ({ ...s, error: err })); return; }
    const preview = URL.createObjectURL(file);
    setState((s) => ({ ...s, videoFile: file, videoPreview: preview, error: null }));
  }, [validateFile]);

  const submit = useCallback(async () => {
    if (!state.imageFile || !state.videoFile) {
      setState((s) => ({ ...s, error: 'Please upload both a target image and AR video.' }));
      return;
    }
    setState((s) => ({ ...s, uploading: true, progress: 0, error: null }));
    try {
      const fd = new FormData();
      fd.append('image', state.imageFile);
      fd.append('video', state.videoFile);
      fd.append('options', JSON.stringify({
        loop: options.loop,
        caption: options.caption,
        password: options.password || undefined,
        expiryDays: parseInt(options.expiryDays) || 30
      }));

      const result = await uploadSticker(fd, (pct) =>
        setState((s) => ({ ...s, progress: pct }))
      );
      setState((s) => ({ ...s, uploading: false, progress: 100, result }));
    } catch (e: any) {
      setState((s) => ({ ...s, uploading: false, error: e.message || 'Upload failed.' }));
    }
  }, [state.imageFile, state.videoFile, options]);

  const reset = useCallback(() => {
    setState({
      imageFile: null, videoFile: null,
      imagePreview: null, videoPreview: null,
      progress: 0, uploading: false, result: null, error: null,
    });
    setOptions({ loop: true, caption: '', password: '', expiryDays: '30' });
  }, []);

  return { state, options, setOptions, setImageFile, setVideoFile, submit, reset };
}