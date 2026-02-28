'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/Appicon';

const navLinks = [
    { label: 'Create', href: '/upload-creation', icon: 'CloudArrowUpIcon' },
    { label: 'Scanner', href: '/ar-scanner', icon: 'CameraIcon' },
    { label: 'AR View', href: '/ar-experience', icon: 'CubeTransparentIcon' },
];

export default function Header() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-[rgba(10,11,20,0.92)] backdrop-blur-xl border-b border-[rgba(124,58,255,0.15)] shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/upload-creation" className="flex items-center gap-2.5 group">
                    <AppLogo size={36} />
                    <span
                        className="font-heading font-bold text-lg tracking-tight"
                        style={{
                            background: 'linear-gradient(135deg, #7C3AFF, #00D4FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        ARStickerHub
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-[rgba(124,58,255,0.15)] text-[#9D6FFF] border border-[rgba(124,58,255,0.3)]'
                                        : 'text-[#8B91B8] hover:text-[#F0F2FF] hover:bg-[rgba(255,255,255,0.05)]'
                                    }`}
                            >
                                <Icon
                                    name={link.icon as any}
                                    size={16}
                                    variant={isActive ? 'solid' : 'outline'}
                                    className={isActive ? 'text-[#7C3AFF]' : ''}
                                />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-blink" />
                        <span className="text-[#00D4FF] text-xs font-mono font-medium">LIVE</span>
                    </div>
                    <Link
                        href="/upload-creation"
                        className="btn-primary px-5 py-2 text-sm rounded-btn flex items-center gap-2"
                    >
                        <Icon name="SparklesIcon" size={15} variant="solid" />
                        Create Sticker
                    </Link>
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="md:hidden p-2 rounded-lg text-[#8B91B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} />
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[rgba(124,58,255,0.15)] bg-[rgba(10,11,20,0.98)] backdrop-blur-xl">
                    <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-card text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-[rgba(124,58,255,0.15)] text-[#9D6FFF]'
                                            : 'text-[#8B91B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                                        }`}
                                >
                                    <Icon name={link.icon as any} size={18} variant={isActive ? 'solid' : 'outline'} />
                                    {link.label}
                                </Link>
                            );
                        })}
                        <div className="pt-2 border-t border-[rgba(124,58,255,0.1)] mt-2">
                            <Link
                                href="/upload-creation"
                                onClick={() => setMobileOpen(false)}
                                className="btn-primary w-full py-3 text-sm rounded-btn flex items-center justify-center gap-2"
                            >
                                <Icon name="SparklesIcon" size={15} variant="solid" />
                                Create AR Sticker
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}