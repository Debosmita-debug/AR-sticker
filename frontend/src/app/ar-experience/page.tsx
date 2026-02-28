import { Suspense } from 'react';
import ARViewerClient from './components/ARViewerClient';

export default function ARExperiencePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    // If searchParams.id is provided, use it. Otherwise fallback to 'demo'
    const idParam = searchParams?.id;
    const stickerId = Array.isArray(idParam) ? idParam[0] : idParam || 'demo';

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#F0F2FF]">Loading AR Experience...</div>}>
            <ARViewerClient stickerId={stickerId} />
        </Suspense>
    );
}