const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface StickerData {
    id: string;
    imageUrl?: string;
    videoUrl: string;
    mindFileUrl: string;
    options: {
        loop?: boolean;
        caption?: string;
        expiresAt?: string;
        password?: boolean;
    };
}

export interface UploadResponse {
    stickerId: string;
    qrUrl: string;
    viewerUrl: string;
    scannerUrl: string;
}

export interface AuthResponse {
    token: string;
    user?: any;
}

async function apiFetch(path: string, init?: RequestInit) {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) {
        const err: any = new Error(`API error: ${res.status}`);
        err.status = res.status;
        const body = await res.json().catch(() => ({}));
        err.message = body.detail || body.message || err.message;
        throw err;
    }
    return res.json();
}

export async function loginUser(credentials: any): Promise<AuthResponse> {
    return { token: 'demo-token' }; // Mock or actual login API here
}

export async function registerUser(credentials: any): Promise<AuthResponse> {
    return { token: 'demo-token' };
}

export function setMemoryToken(token: string) {
    // Store token in memory or local storage securely
}

export async function getStickerData(id: string, password?: string): Promise<StickerData> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (password) headers['X-Sticker-Password'] = password;
    return apiFetch(`/api/stickers/${id}`, { headers });
}

export async function trackScan(id: string): Promise<void> {
    try {
        await apiFetch(`/api/stickers/${id}/scan`, { method: 'POST' });
    } catch {
        // Silently fail
    }
}

export async function uploadSticker(
    imageFile: File,
    videoFile: File,
    options: Record<string, any>,
    onProgress?: (pct: number) => void
): Promise<UploadResponse> {
    const form = new FormData();
    form.append('image', imageFile);
    form.append('video', videoFile);
    form.append('options', JSON.stringify(options));
    // In a real app we would use XHR for progress tracking
    if (onProgress) {
        onProgress(50);
    }
    const result = await apiFetch('/api/stickers', { method: 'POST', body: form });
    if (onProgress) {
        onProgress(100);
    }
    return result;
}