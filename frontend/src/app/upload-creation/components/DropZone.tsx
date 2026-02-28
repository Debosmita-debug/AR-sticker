'use client';

import React, { useRef, useState } from 'react';
import Icon from '@/components/ui/Appicon';

interface DropZoneProps {
    type: 'image' | 'video';
    preview?: string | null;
    fileName?: string;
    onFile: (file: File) => void;
    label: string;
    subLabel: string;
    accept: string;
    icon: string;
    accentColor: 'violet' | 'cyan';
}

export default function DropZone({
    type,
    preview,
    fileName,
    onFile,
    label,
    subLabel,
    accept,
    icon,
    accentColor,
}: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFile = (file: File) => {
        onFile(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const accentColors = {
        violet: {
            border: 'border-[#7C3AFF]',
            bg: 'bg-[#7C3AFF]/5',
            text: 'text-[#7C3AFF]',
            hover: 'hover:bg-[#7C3AFF]/10',
        },
        cyan: {
            border: 'border-[#00D4FF]',
            bg: 'bg-[#00D4FF]/5',
            text: 'text-[#00D4FF]',
            hover: 'hover:bg-[#00D4FF]/10',
        },
    };

    const colors = accentColors[accentColor];

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
                aria-label={`Upload ${type}`}
            />

            {preview ? (
                <div className="relative w-full h-48 sm:h-56 rounded-card overflow-hidden bg-[#1A1D2D] border border-[#2D3142]">
                    {type === 'image' ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <video
                            src={preview}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                        />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col items-center justify-end p-4">
                        <p className="text-xs text-white/70 text-center truncate max-w-full">
                            {fileName}
                        </p>
                        <button
                            onClick={handleClick}
                            className={`mt-2 px-3 py-1.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} transition-colors ${colors.hover}`}
                        >
                            Change {type === 'image' ? 'Image' : 'Video'}
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={handleClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative w-full h-48 sm:h-56 rounded-card border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                        isDragOver
                            ? `${colors.border} ${colors.bg}`
                            : 'border-[#2D3142] bg-[#0A0B14]/50 hover:bg-[#1A1D2D]'
                    }`}
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-lg ${colors.bg}`}>
                            <Icon
                                name={icon as any}
                                size={24}
                                className={colors.text}
                                variant="solid"
                            />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-semibold text-white">
                                {isDragOver ? 'Drop your files here' : label}
                            </p>
                            {!isDragOver && (
                                <p className="text-xs text-[#8B91B8] mt-1">{subLabel}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
