const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────
export interface UploadResponse {
  id: string;
  arPageUrl: string;
  scanPageUrl: string;
}

export interface StickerData {
  id: string;
  imageUrl: string;
  videoUrl: string;
  mindFileUrl: string;
  options: {
    loop: boolean;
    caption?: string;
    hasPassword: boolean;
    expiresAt?: string;
  };
  scanCount: number;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface DashboardSticker {
  id: string;
  imageUrl: string;
  caption?: string;
  scanCount: number;
  createdAt: string;
  arPageUrl: string;
}

// ── Upload ─────────────────────────────────────────────
export async function uploadSticker(
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/api/upload`);

    const token = getMemoryToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const json = JSON.parse(xhr.responseText);
        // Unwrap data from { success, data } response
        resolve(json.data || json);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

// ── Sticker Data ───────────────────────────────────────
export async function getStickerData(id: string, password?: string): Promise<StickerData> {
  const headers: Record<string, string> = {};
  if (password) headers['X-Sticker-Password'] = password;
  const token = getMemoryToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/ar/${id}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error?.message || err.message || 'Failed to load sticker'), { status: res.status });
  }
  const json = await res.json();
  return json.data || json;
}

// ── Scan Tracking ──────────────────────────────────────
export async function trackScan(id: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/scan/${id}`, { method: 'POST' });
  } catch {
    // Non-critical — swallow errors
  }
}

// ── Auth ───────────────────────────────────────────────
export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Registration failed');
  const json = await res.json();
  return json.data || json;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  const json = await res.json();
  return json.data || json;
}

// ── Dashboard ──────────────────────────────────────────
export async function getDashboardStickers(token: string): Promise<DashboardSticker[]> {
  const res = await fetch(`${BASE_URL}/api/auth/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  const json = await res.json();
  return json.data?.stickers || [];
}

export async function deleteSticker(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/ar/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Delete failed');
}

// ── In-memory token helper (used internally) ──────────
let _memToken: string | null = null;
export function setMemoryToken(t: string | null) { _memToken = t; }
export function getMemoryToken(): string | null { return _memToken; }