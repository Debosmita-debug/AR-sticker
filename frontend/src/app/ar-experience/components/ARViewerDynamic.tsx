'use client';

import dynamic from 'next/dynamic';
import type { StickerData } from '@/lib/api';

interface ARViewerDynamicProps {
  stickerId: string;
  initialData: StickerData | null;
}

const ARViewerClient = dynamic(
  () => import('./ARViewerClient'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#0A0B14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AFF] animate-spin" />
          </div>
          <p className="text-[#8B91B8] text-sm">Loading AR Experience…</p>
        </div>
      </div>
    ),
  }
);

export default function ARViewerDynamic({ stickerId, initialData }: ARViewerDynamicProps) {
  return <ARViewerClient stickerId={stickerId} initialData={initialData} />;
}
