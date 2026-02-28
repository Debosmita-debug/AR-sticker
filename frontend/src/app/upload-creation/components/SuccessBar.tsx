import React from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '@/components/ui/AppIcon';

interface SuccessBarProps {
    qrUrl?: string;
    viewerUrl?: string;
    scannerUrl?: string;
}

export default function SuccessBar({ qrUrl, viewerUrl, scannerUrl }: SuccessBarProps) {
    if (!qrUrl && !viewerUrl && !scannerUrl) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-sm">
                {viewerUrl && (
                    <QRCodeSVG
                        value={viewerUrl}
                        size={120}
                        level="M"
                        includeMargin={true}
                        aria-label="QR Code to view AR Sticker"
                    />
                )}
            </div>
            <div className="flex-grow space-y-4">
                <div>
                    <p className="text-[#8B91B8] text-xs font-semibold uppercase tracking-wider mb-1">Viewer Link</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={viewerUrl || ''}
                            className="input-field w-full text-sm bg-[rgba(0,0,0,0.2)] focus:outline-none"
                        />
                        <button
                            onClick={() => viewerUrl && navigator.clipboard.writeText(viewerUrl)}
                            className="p-2.5 rounded-lg bg-[rgba(124,58,255,0.1)] text-[#7C3AFF] hover:bg-[rgba(124,58,255,0.2)]"
                        >
                            <Icon name="DocumentDuplicateIcon" size={16} />
                        </button>
                    </div>
                </div>
                <div>
                    <Link href={viewerUrl || '/ar-experience'} className="btn-secondary w-full flex items-center justify-center py-2.5 text-sm rounded-lg">
                        Open Experience Page
                    </Link>
                </div>
            </div>
        </div>
    );
}
