'use client';

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Icon from '@/components/ui/Appicon';

interface DropZoneProps {
  type: 'image' | 'video';
  preview: string | null;
  fileName?: string;
  onFile: (file: File) => void;
  label: string;
  subLabel: string;
  accept: string;
  icon: string;
  accentColor?: 'violet' | 'cyan';
}

export default function DropZone({
  type, preview, fileName, onFile, label, subLabel, accept, icon, accentColor = 'violet',
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const borderColor = accentColor === 'cyan' ? (dragging ?'border-[#00D4FF]' : 'border-[rgba(0,212,255,0.2)]')
    : (dragging ? 'border-[#7C3AFF]' : 'border-[rgba(124,58,255,0.2)]');

  const bgColor = accentColor === 'cyan' ? (dragging ?'bg-[rgba(0,212,255,0.05)]' : 'bg-[rgba(0,212,255,0.02)]')
    : (dragging ? 'bg-[rgba(124,58,255,0.07)]' : 'bg-[rgba(124,58,255,0.02)]');

  const iconColor = accentColor === 'cyan' ? 'text-[#00D4FF]' : 'text-[#7C3AFF]';
  const glowColor = accentColor === 'cyan' ?'shadow-[0_0_30px_rgba(0,212,255,0.15)]' :'shadow-[0_0_30px_rgba(124,58,255,0.15)]';

  return (
    <div
      className={`relative border-2 border-dashed rounded-card p-6 cursor-pointer transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center group
        ${borderColor} ${bgColor} ${dragging ? glowColor : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label={`Upload ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        aria-label={`File input for ${label}`}
      />

      {preview ? (
        <div className="w-full h-full flex flex-col items-center gap-3">
          {type === 'image' ? (
            <div className="w-full h-40 rounded-xl overflow-hidden relative">
              <img
                src={preview}
                alt={`Preview of uploaded target image: ${fileName || 'uploaded file'}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <video
              src={preview}
              className="w-full h-40 rounded-xl object-cover"
              muted
              loop
              playsInline
              autoPlay
              aria-label={`Preview of uploaded AR video: ${fileName || 'uploaded video'}`}
            />
          )}
          <div className="flex items-center gap-2 text-xs text-[#8B91B8]">
            <Icon name="CheckCircleIcon" size={14} variant="solid" className={iconColor} />
            <span className="truncate max-w-[200px] font-mono">{fileName}</span>
          </div>
          <span className={`text-xs font-medium ${iconColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
            Click to replace
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center select-none">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110
            ${accentColor === 'cyan' ? 'bg-[rgba(0,212,255,0.1)]' : 'bg-[rgba(124,58,255,0.1)]'}`}>
            <Icon name={icon as any} size={26} className={iconColor} />
          </div>
          <div>
            <p className="font-heading font-semibold text-[#F0F2FF] text-sm">{label}</p>
            <p className="text-[#4A5080] text-xs mt-1">{subLabel}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200
            ${accentColor === 'cyan' ?'bg-[rgba(0,212,255,0.08)] text-[#00D4FF] border border-[rgba(0,212,255,0.2)]' :'bg-[rgba(124,58,255,0.08)] text-[#9D6FFF] border border-[rgba(124,58,255,0.2)]'}`}>
            <Icon name="CloudArrowUpIcon" size={13} />
            Drop file or click to browse
          </div>
        </div>
      )}
    </div>
  );
}

