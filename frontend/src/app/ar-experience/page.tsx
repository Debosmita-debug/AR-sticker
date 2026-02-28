import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getStickerData } from '@/lib/api';
import ARViewerDynamic from './components/ARViewerDynamic';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

// Generate dynamic metadata per sticker
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const id = params?.id;
  if (!id) {
    return {
      title: 'AR Experience — ARStickerHub',
      description: 'View an augmented reality sticker experience.',
    };
  }

  try {
    const data = await getStickerData(id);
    return {
      title: data.options.caption
        ? `${data.options.caption} — ARStickerHub`
        : 'AR Experience — ARStickerHub',
      description: data.options.caption || 'Point your camera at the target image to reveal the AR experience.',
      openGraph: {
        title: data.options.caption || 'AR Experience',
        description: 'Scan this AR sticker to reveal a hidden video experience.',
        images: [{ url: data.imageUrl, alt: 'AR sticker target image' }],
      },
    };
  } catch {
    return {
      title: 'AR Experience — ARStickerHub',
      description: 'View this AR sticker experience.',
    };
  }
}

export default async function ARExperiencePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const stickerId = params?.id || '';

  // Server-side prefetch (non-password-protected stickers only)
  let initialData = null;
  if (stickerId) {
    try {
      initialData = await getStickerData(stickerId);
    } catch {
      // Will be handled client-side (e.g., password-protected)
      initialData = null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <Suspense
        fallback={
          <div className="fixed inset-0 bg-[#0A0B14] flex items-center justify-center">
            <p className="text-[#8B91B8] text-sm">Preparing experience…</p>
          </div>
        }
      >
        <ARViewerDynamic stickerId={stickerId} initialData={initialData} />
      </Suspense>
    </div>
  );
}