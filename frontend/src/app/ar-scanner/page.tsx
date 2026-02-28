import type { Metadata } from 'next';
import { Suspense } from 'react';
import ARScannerDynamic from './components/ARScannerDynamic';

export const metadata: Metadata = {
  title: 'AR Scanner — ARStickerHub',
  description: 'Scan your AR sticker to reveal the augmented reality experience. Point your camera at the target image.',
};

export default function ARScannerPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <Suspense
        fallback={
          <div className="fixed inset-0 bg-[#0A0B14] flex items-center justify-center">
            <p className="text-[#8B91B8] text-sm">Loading…</p>
          </div>
        }
      >
        <ARScannerDynamic />
      </Suspense>
    </div>
  );
}