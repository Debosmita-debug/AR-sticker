'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UploadResponse } from '@/lib/api';
import Icon from '@/components/ui/Appicon';

// QR code loaded only on client
const QRCode = dynamic(() => import('qrcode.react').then((m) => m.QRCodeSVG), { ssr: false });

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
          <h2 className="font-heading font-bold text-2xl text-[#F0F2FF]">AR Sticker Created!</h2>
          <p className="text-[#8B91B8] text-sm mt-1">Your sticker is live and ready to scan.</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="card p-6 flex flex-col items-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#4A5080]">Scan QR to test AR</p>
        <div className="p-4 bg-white rounded-xl shadow-inner">
          <QRCode
            value={arUrl}
            size={160}
            level="M"
            includeMargin={false}
            aria-label="QR code linking to AR experience"
          />
        </div>
        <p className="text-xs text-[#4A5080] text-center max-w-[220px]">
          Point your phone camera at this code to preview the AR experience
        </p>
      </div>

      {/* Links */}
      <div className="space-y-3">
        {/* AR Link */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#4A5080] font-medium mb-1 flex items-center gap-1">
                <Icon name="CubeTransparentIcon" size={12} className="text-[#7C3AFF]" />
                AR Experience Link
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

        {/* Scanner Link */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#4A5080] font-medium mb-1 flex items-center gap-1">
                <Icon name="CameraIcon" size={12} className="text-[#00D4FF]" />
                Scanner Link
              </p>
              <p className="text-xs font-mono text-[#8B91B8] truncate">{scanUrl}</p>
            </div>
            <button
              onClick={() => copy(scanUrl, 'scan')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                ${copied === 'scan' ?'bg-[rgba(0,212,255,0.15)] text-[#00D4FF] border border-[rgba(0,212,255,0.3)]' :'btn-secondary'}`}
              aria-label="Copy scanner link"
            >
              <Icon name={copied === 'scan' ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={13} />
              {copied === 'scan' ? 'Copied!' : 'Copy'}
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