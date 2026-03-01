import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Auth0ProviderWrapper } from "@/components/Auth0ProviderWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "V-Sticker | Next-Gen AR Manifest",
  description: "Materialize digital assets into reality with our cutting-edge AR engine. Create, scan, and manage immersive stickers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-black text-white min-h-screen selection:bg-primary/30 selection:text-primary`}
      >
        <Auth0ProviderWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Auth0ProviderWrapper>
      </body>
    </html>
  );
}
