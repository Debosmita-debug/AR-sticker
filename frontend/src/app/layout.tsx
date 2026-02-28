import type { Metadata } from 'next';
import './globals.css';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'ARStickerHub — Bring Stickers to Life',
  description: 'Upload a target image and AR video to create your own augmented reality sticker experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
