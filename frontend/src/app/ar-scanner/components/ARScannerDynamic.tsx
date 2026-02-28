'use client';

import dynamic from 'next/dynamic';

const ARScannerClientDynamic = dynamic(
  () => import('./ARScannerClient'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#0A0B14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AFF] animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#00D4FF] animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
          <p className="text-[#8B91B8] text-sm font-medium">Preparing AR Scanner…</p>
        </div>
      </div>
    ),
  }
);

export default function ARScannerDynamic() {
  return <ARScannerClientDynamic />;
}
