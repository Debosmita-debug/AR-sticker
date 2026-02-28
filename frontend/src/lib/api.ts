const API_BASE = "/api";

let authToken: string | null = null;

export const setToken = (token: string | null) => {
  authToken = token;
};

export const getToken = () => authToken;

const headers = (): HeadersInit => {
  const h: HeadersInit = {};
  if (authToken) h["Authorization"] = `Bearer ${authToken}`;
  return h;
};

export interface UploadOptions {
  loop: boolean;
  caption: string;
  password: string;
  expiry: string;
}

export interface UploadResult {
  id: string;
  arPageUrl: string;
  scanPageUrl: string;
}

export interface StickerData {
  imageUrl: string;
  videoUrl: string;
  mindFileUrl: string;
  options: {
    loop: boolean;
    caption: string;
    password: string;
    expiry: string;
  };
}

export interface DashboardSticker {
  id: string;
  thumbnailUrl: string;
  scanCount: number;
  createdAt: string;
  caption: string;
}

// ── Demo mode helpers ──────────────────────────────────────────────
// Since there's no backend yet, we simulate API responses so the full
// UI is interactive and testable.

const DEMO = true; // flip to false once a real backend is connected

let demoStickers: DashboardSticker[] = [];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── API functions ──────────────────────────────────────────────────

export async function uploadSticker(
  image: File,
  video: File,
  options: UploadOptions
): Promise<UploadResult> {
  if (DEMO) {
    await delay(1500);
    const id = uid();
    // Store in demo stickers list
    demoStickers.unshift({
      id,
      thumbnailUrl: URL.createObjectURL(image),
      scanCount: 0,
      createdAt: new Date().toISOString(),
      caption: options.caption || "Untitled Sticker",
    });
    return {
      id,
      arPageUrl: `/ar/${id}`,
      scanPageUrl: `/scanner/${id}`,
    };
  }

  const fd = new FormData();
  fd.append("image", image);
  fd.append("video", video);
  fd.append("loop", String(options.loop));
  fd.append("caption", options.caption);
  fd.append("password", options.password);
  fd.append("expiry", options.expiry);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: headers(),
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function getStickerData(id: string): Promise<StickerData> {
  if (DEMO) {
    await delay(500);
    return {
      imageUrl: "/placeholder.svg",
      videoUrl: "",
      mindFileUrl: `/mind/${id}.mind`,
      options: { loop: true, caption: "Demo Sticker", password: "", expiry: "never" },
    };
  }

  const res = await fetch(`/ar/${id}`, { headers: headers() });
  if (!res.ok) throw new Error("Sticker not found");
  return res.json();
}

export async function trackScan(id: string): Promise<void> {
  if (DEMO) {
    const s = demoStickers.find((x) => x.id === id);
    if (s) s.scanCount++;
    return;
  }
  await fetch(`${API_BASE}/scan/${id}`, { method: "POST", headers: headers() });
}

export async function login(email: string, password: string): Promise<string> {
  if (DEMO) {
    await delay(600);
    if (!email || !password) throw new Error("Login failed");
    const token = "demo_token_" + uid();
    setToken(token);
    return token;
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  setToken(data.token);
  return data.token;
}

export async function register(email: string, password: string): Promise<string> {
  if (DEMO) {
    await delay(600);
    if (!email || !password) throw new Error("Registration failed");
    const token = "demo_token_" + uid();
    setToken(token);
    return token;
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Registration failed");
  const data = await res.json();
  setToken(data.token);
  return data.token;
}

export async function getDashboard(): Promise<DashboardSticker[]> {
  if (DEMO) {
    await delay(400);
    return demoStickers;
  }

  const res = await fetch(`${API_BASE}/dashboard`, { headers: headers() });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export async function deleteSticker(id: string): Promise<void> {
  if (DEMO) {
    await delay(300);
    demoStickers = demoStickers.filter((s) => s.id !== id);
    return;
  }

  const res = await fetch(`${API_BASE}/sticker/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Failed to delete sticker");
}
