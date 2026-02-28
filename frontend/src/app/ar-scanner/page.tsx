import { Suspense } from 'react';
import ARScannerClient from './components/ARScannerClient';

export default function ARScannerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#F0F2FF]">Loading AR Scanner...</div>}>
            <ARScannerClient />
        </Suspense>
    );
}