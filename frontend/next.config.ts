import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://aframe.io https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' data: blob: http://localhost:* https://aframe.io https://cdn.jsdelivr.net https://res.cloudinary.com https://*.cloudinary.com https://backend.zynvo.social https://upload.imagekit.io https://zynvo-backend-ho7y.onrender.com https://zynvo-backend-1.onrender.com https://zynvo-backend.onrender.com https://api.dicebear.com https://api.qrserver.com https://eager-bonefish-30.clerk.accounts.dev https://clerk.accounts.dev https://clerk.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://images.unsplash.com",
              "media-src 'self' blob: https://res.cloudinary.com https://*.cloudinary.com",
              "frame-src 'self'",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/ar/:path*",
        destination: `${backendUrl}/ar/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
