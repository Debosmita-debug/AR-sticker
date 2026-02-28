import React from 'react';
import Icon from '@/components/ui/Appicon';

interface ProgressBarProps {
    progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                <span className="text-[#F0F2FF] flex items-center gap-1.5">
                    <Icon name="ArrowUpTrayIcon" size={12} className="text-[#00D4FF]" />
                    Uploading
                </span>
                <span className="text-[#00D4FF]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
                <div
                    className="h-full bg-gradient-to-r from-[#7C3AFF] to-[#00D4FF] transition-all duration-300 ease-out relative"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-scan opacity-50" />
                </div>
            </div>
        </div>
    );
}