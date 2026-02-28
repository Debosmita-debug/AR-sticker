import React from 'react';
import * as SolidIcons from '@heroicons/react/24/solid';
import * as OutlineIcons from '@heroicons/react/24/outline';

interface AppIconProps {
    name: string;
    size?: number;
    className?: string;
    variant?: 'solid' | 'outline';
}

export default function AppIcon({ name, size = 24, className = '', variant = 'outline' }: AppIconProps) {
    const IconComponent = variant === 'solid'
        ? (SolidIcons as any)[name]
        : (OutlineIcons as any)[name];

    if (!IconComponent) {
        console.warn(`Icon ${name} not found in Heroicons.`);
        return <span className={`inline-block w-${size / 4} h-${size / 4} ${className}`} />;
    }

    return <IconComponent style={{ width: size, height: size }} className={className} aria-hidden="true" />;
}
