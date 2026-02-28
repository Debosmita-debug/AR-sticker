'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UploadResponse } from '@/lib/api';
import Icon from '@/components/ui/Appicon';

interface SuccessPanelProps {
  result: UploadResponse;
  onReset: () => void;
}

export default function SuccessPanel({ result, onReset }: SuccessPanelProps) {
  const [copied, setCopied] = useState<'ar' | 'scan' | null>(null);

  const copy = async (text: string, key: 'ar' | 'scan') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const arUrl = result.arPageUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/ar-experience?id=${result.id}`;
  const scanUrl = result.scanPageUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/ar-scanner?id=${result.id}`;

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-3">
        <div className="relative inline-flex">
          <div className="w-16 h-16 rounded-full bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center">
            <Icon name="CheckCircleIcon" size={32} variant="solid" className="text-[#00D4FF]" />
          </div>
          <span className="absolute inset-0 rounded-full bg-[rgba(0,212,255,0.2)] animate-pulse-ring" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#F0F2FF]">AR Sticker Created! 🎉</h2>
          <p className="text-[#8B91B8] text-sm mt-1">Now share this link with anyone to let them scan your image and see the AR video.</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="card p-5 bg-[rgba(124,58,255,0.08)] border border-[rgba(124,58,255,0.2)]">
        <h3 className="text-sm font-semibold text-[#F0F2FF] mb-3 flex items-center gap-2">
          <Icon name="QuestionMarkCircleIcon" size={16} className="text-[#7C3AFF]" />
          How to Use Your AR Sticker
        </h3>
        <ol className="space-y-2 text-xs text-[#8B91B8]">
          <li className="flex gap-2">
            <span className="font-semibold text-[#7C3AFF] flex-shrink-0">1.</span>
            <span>Share the scanner link with anyone</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[#7C3AFF] flex-shrink-0">2.</span>
            <span>They open the link on their phone</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[#00D4FF] flex-shrink-0">3.</span>
            <span>They point their camera at your uploaded image</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[#00D4FF] flex-shrink-0">4.</span>
            <span>The AR video appears on top of the image!</span>
          </li>
        </ol>
      </div>

      {/* Sharable Link */}
      <div className="space-y-3">
        {/* Scanner Link - Primary */}
        <div className="card p-4 border-2 border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#00D4FF] font-bold mb-1 flex items-center gap-1">
                <Icon name="SparklesIcon" size={14} className="text-[#00D4FF]" />
                🎯 SHARE THIS LINK
              </p>
              <p className="text-xs font-mono text-[#F0F2FF] truncate break-all">{scanUrl}</p>
            </div>
            <button
              onClick={() => copy(scanUrl, 'scan')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200
                ${copied === 'scan' ?'bg-[rgba(0,212,255,0.25)] text-[#00D4FF] border border-[rgba(0,212,255,0.5)]' :'bg-[#7C3AFF] text-white hover:bg-[#9B5FFF]'}`}
              aria-label="Copy scanner link"
            >
              <Icon name={copied === 'scan' ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={13} />
              {copied === 'scan' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* AR Experience Link - Secondary */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#4A5080] font-medium mb-1 flex items-center gap-1">
                <Icon name="CubeTransparentIcon" size={12} className="text-[#7C3AFF]" />
                Direct AR Link
              </p>
              <p className="text-xs font-mono text-[#8B91B8] truncate">{arUrl}</p>
            </div>
            <button
              onClick={() => copy(arUrl, 'ar')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                ${copied === 'ar' ?'bg-[rgba(0,212,255,0.15)] text-[#00D4FF] border border-[rgba(0,212,255,0.3)]' :'btn-secondary'}`}
              aria-label="Copy AR experience link"
            >
              <Icon name={copied === 'ar' ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={13} />
              {copied === 'ar' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/ar-scanner?id=${result.id}`}
          className="btn-primary flex-1 py-3 text-sm rounded-btn flex items-center justify-center gap-2"
        >
          <Icon name="CameraIcon" size={16} />
          Open Scanner
        </Link>
        <button
          onClick={onReset}
          className="btn-secondary flex-1 py-3 text-sm rounded-btn flex items-center justify-center gap-2"
        >
          <Icon name="PlusCircleIcon" size={16} />
          Create Another
        </button>
      </div>
    </div>
  );
}