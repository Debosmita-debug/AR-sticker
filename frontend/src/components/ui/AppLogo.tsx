import Link from 'next/link';
import AppIcon from './Appicon';

interface AppLogoProps {
    className?: string;
    size?: number;
}

export default function AppLogo({ className = '', size }: AppLogoProps) {
    return (
        <Link href="/" className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#7C3AFF] to-[#00D4FF] flex items-center justify-center shadow-[0_0_15px_rgba(124,58,255,0.4)]">
                    <AppIcon name="CubeTransparentIcon" size={24} className="text-white" variant="solid" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1A1D2D] border-2 border-[#1A1D2D] flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#00D4FF] animate-pulse-ring" />
                </div>
            </div>
            <div>
                <span className="font-heading font-bold text-lg md:text-xl text-glow tracking-tight text-[#F0F2FF]">
                    ARSticker<span className="text-[#00D4FF]">Hub</span>
                </span>
            </div>
        </Link>
    );
}
