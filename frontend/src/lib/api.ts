/**
 * api.ts – All frontend ↔ backend communication.
 * Auth tokens are managed by AuthContext (in memory only, never localStorage).
 */

import { BACKEND_BASE } from "./backendBase";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UploadOptions {
  loop: boolean;
  caption: string;
  password: string;
  /** "7" | "30" | "90" | "365" | "never" */
  expiry: string;
}

export interface UploadResult {
  id: string;
  arPageUrl: string;
  scanPageUrl: string;
  imageUrl: string;
  expiresAt: string;
  createdAt: string;
}

export interface StickerData {
  id: string;
  imageUrl: string;
  videoUrl: string;
  mindFileUrl: string;
  options: {
    loop: boolean;
    caption: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface StickerMetadata {
  id: string;
  caption: string;
  isPasswordProtected: boolean;
  scanCount: number;
  createdAt: string;
  expiresAt: string;
  daysUntilExpiry: number;
}

export interface DashboardSticker {
  id: string;
  imageUrl: string;
  videoUrl: string;
  scanCount: number;
  createdAt: string;
  expiresAt: string;
  options: {
    loop: boolean;
    caption: string;
    expiryDays: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  plan: "free" | "pro" | "enterprise";
}

export interface ScanAnalytic {
  timestamp: string;
  userAgent: string;
  country: string;
}

export interface ScanAnalyticsResult {
  id: string;
  scanCount: number;
  lastScannedAt: string | null;
  scanHistory: ScanAnalytic[];
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function authHeaders(token?: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function expiryToDays(expiry: string): number {
  switch (expiry) {
    case "7": return 7;
    case "30": return 30;
    case "90": return 90;
    case "365":
    case "never":
    default: return 365;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (json as { data: T }).data;
}

// ── Upload ───────────────────────────────────────────────────────────────────
// All requests go directly to the backend, bypassing the Next.js proxy which
// is unreliable for both large bodies and regular GET requests in v16.
const BACKEND_DIRECT = BACKEND_BASE;

export async function uploadSticker(
  image: File,
  video: File,
  options: UploadOptions,
  token?: string | null
): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("image", image);
  fd.append("video", video);
  fd.append("options", JSON.stringify({
    loop: options.loop,
    caption: options.caption || undefined,
    password: options.password || undefined,
    expiryDays: expiryToDays(options.expiry),
  }));

  const res = await fetch(`${BACKEND_DIRECT}/api/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
  });
  return handleResponse<UploadResult>(res);
}

// ── AR data ──────────────────────────────────────────────────────────────────

export async function getStickerData(
  id: string,
  password?: string,
  token?: string | null
): Promise<StickerData> {
  const params = password ? `?password=${encodeURIComponent(password)}` : "";
  const res = await fetch(`${BACKEND_DIRECT}/ar/${id}${params}`, { headers: authHeaders(token) });

  if (res.status === 403) {
    const json = await res.json().catch(() => ({}));
    const code = (json as { error?: { code?: string } })?.error?.code;
    if (code === "PASSWORD_REQUIRED") throw new Error("PASSWORD_REQUIRED");
    if (code === "INVALID_PASSWORD") throw new Error("INVALID_PASSWORD");
  }
  if (res.status === 410) throw new Error("STICKER_EXPIRED");
  if (res.status === 404) throw new Error("STICKER_NOT_FOUND");

  return handleResponse<StickerData>(res);
}

export async function getStickerMetadata(id: string): Promise<StickerMetadata> {
  const res = await fetch(`${BACKEND_DIRECT}/ar/${id}/metadata`);
  if (res.status === 410) throw new Error("STICKER_EXPIRED");
  return handleResponse<StickerMetadata>(res);
}

// ── Scan tracking ─────────────────────────────────────────────────────────────

export async function trackScan(id: string): Promise<void> {
  await fetch(`${BACKEND_DIRECT}/api/scan/${id}`, { method: "POST" }).catch(() => {});
}

// ── Universal scanner ─────────────────────────────────────────────────────────

export interface UniversalTarget {
  targetIndex: number;
  stickerId: string;
  videoUrl: string;
  imageUrl: string;
  options: {
    loop: boolean;
    caption: string;
  };
}

export interface UniversalScannerData {
  mindFileUrl: string | null;
  targets: UniversalTarget[];
}

export async function getUniversalTargets(): Promise<UniversalScannerData> {
  const res = await fetch(`${BACKEND_DIRECT}/api/scan/universal`);
  return handleResponse<UniversalScannerData>(res);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BACKEND_DIRECT}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResult>(res);
}

export async function register(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BACKEND_DIRECT}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResult>(res);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardResult {
  user: AuthUser;
  stickers: DashboardSticker[];
  totalStickers: number;
  plan: string;
}

export async function getDashboard(token: string): Promise<DashboardResult> {
  const res = await fetch(`${BACKEND_DIRECT}/api/auth/dashboard`, { headers: authHeaders(token) });
  return handleResponse<DashboardResult>(res);
}

// ── Delete sticker ─────────────────────────────────────────────────────────────

export async function deleteSticker(id: string, token: string): Promise<void> {
  const res = await fetch(`${BACKEND_DIRECT}/api/auth/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const msg = (json as { error?: { message?: string } })?.error?.message || "Failed to delete";
    throw new Error(msg);
  }
}

// ── Scan analytics ─────────────────────────────────────────────────────────────

export async function getScanAnalytics(id: string, token: string): Promise<ScanAnalyticsResult> {
  const res = await fetch(`${BACKEND_DIRECT}/api/scan/${id}/analytics`, { headers: authHeaders(token) });
  return handleResponse<ScanAnalyticsResult>(res);
}
