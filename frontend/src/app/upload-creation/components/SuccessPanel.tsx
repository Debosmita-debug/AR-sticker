import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Appicon';
import SuccessBar from './SuccessBar';

interface SuccessPanelProps {
    result: any;
    onReset: () => void;
}

export default function SuccessPanel({ result, onReset }: SuccessPanelProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center mx-auto mb-6">
                    <Icon name="CheckBadgeIcon" size={36} className="text-[#00D4FF]" />
                </div>
                <h2 className="font-heading font-bold text-2xl text-[#F0F2FF] mb-2">
                    Sticker Created Successfully!
                </h2>
                <p className="text-[#8B91B8] text-sm mb-6">
                    Your AR sticker is ready. You can test the experience right away.
                </p>
            </div>

            <div className="glass rounded-xl overflow-hidden p-6 border border-[rgba(0,212,255,0.2)]">
                <SuccessBar qrUrl={result?.qrUrl} viewerUrl={result?.viewerUrl} scannerUrl={result?.scannerUrl} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <Link href={result?.scannerUrl || '/ar-scanner'} className="btn-primary py-3 text-sm rounded-btn flex items-center justify-center gap-2">
                    <Icon name="ArrowRightIcon" size={15} />
                    Test Scanner
                </Link>
                <button onClick={onReset} className="btn-secondary py-3 text-sm rounded-btn">
                    Create Another
                </button>
            </div>
        </div>
    );
}