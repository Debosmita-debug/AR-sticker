import { useState } from 'react';
import { uploadSticker, UploadResponse } from '@/lib/api';

export function useUpload() {
    const [state, setState] = useState<{
        imageFile: File | null;
        videoFile: File | null;
        imagePreview: string | null;
        videoPreview: string | null;
        uploading: boolean;
        progress: number;
        error: string | null;
        result: UploadResponse | null;
    }>({
        imageFile: null,
        videoFile: null,
        imagePreview: null,
        videoPreview: null,
        uploading: false,
        progress: 0,
        error: null,
        result: null,
    });

    const [options, setOptions] = useState<Record<string, any>>({});

    const setImageFile = (file: File | null, preview?: string) => {
        setState((s) => ({ ...s, imageFile: file, imagePreview: preview || null }));
    };

    const setVideoFile = (file: File | null, preview?: string) => {
        setState((s) => ({ ...s, videoFile: file, videoPreview: preview || null }));
    };

    const submit = async () => {
        if (!state.imageFile || !state.videoFile) return;
        setState((s) => ({ ...s, uploading: true, error: null, progress: 0 }));

        try {
            const res = await uploadSticker(state.imageFile, state.videoFile, options, (pct: number) => {
                setState((s) => ({ ...s, progress: pct }));
            });
            setState((s) => ({ ...s, result: res, uploading: false }));
        } catch (e: any) {
            setState((s) => ({ ...s, error: e.message || 'Upload failed', uploading: false }));
        }
    };

    const reset = () => {
        setState({
            imageFile: null,
            videoFile: null,
            imagePreview: null,
            videoPreview: null,
            uploading: false,
            progress: 0,
            error: null,
            result: null,
        });
    };

    return { state, options, setOptions, setImageFile, setVideoFile, submit, reset };
}