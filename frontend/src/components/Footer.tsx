import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(124,58,255,0.12)] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Logo + Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link href="/upload-creation" className="flex items-center gap-2 group">
              <AppLogo size={24} />
              <span className="font-heading font-semibold text-[#8B91B8] group-hover:text-[#F0F2FF] transition-colors">
                ARStickerHub
              </span>
            </Link>
            <span className="hidden sm:block text-[#4A5080]">·</span>
            <Link href="/upload-creation" className="text-[#4A5080] hover:text-[#8B91B8] transition-colors font-medium">
              Create
            </Link>
            <Link href="/ar-scanner" className="text-[#4A5080] hover:text-[#8B91B8] transition-colors font-medium">
              Scanner
            </Link>
            <Link href="/ar-experience" className="text-[#4A5080] hover:text-[#8B91B8] transition-colors font-medium">
              AR View
            </Link>
          </div>

          {/* Right: Social + Legal */}
          <div className="flex items-center gap-4 text-sm text-[#4A5080]">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00D4FF] transition-colors"
              aria-label="Twitter"
            >
              <Icon name="GlobeAltIcon" size={16} />
            </a>
            <span>·</span>
            <span>Privacy</span>
            <span>·</span>
            <span>Terms</span>
            <span>·</span>
            <span>© 2026 ARStickerHub</span>
          </div>
        </div>
      </div>
    </footer>
  );
}