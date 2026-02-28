import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UploadCreationClient from './components/UploadCreationClient';
import Icon from '@/components/ui/Appicon';

export const metadata: Metadata = {
  title: 'Create AR Sticker — ARStickerHub',
  description:
    'Upload a target image and AR video to generate a scannable augmented reality sticker experience. Share via QR code or link.',
  openGraph: {
    title: 'Create AR Sticker — ARStickerHub',
    description: 'Turn any printed sticker into a living AR experience in under 60 seconds.',
  },
};

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: 'PhotoIcon',
    title: 'Upload Target Image',
    desc: 'The printed image your camera will recognize — a logo, artwork, or custom design.',
  },
  {
    step: '02',
    icon: 'VideoCameraIcon',
    title: 'Attach AR Video',
    desc: 'The video that plays when the sticker is detected. MP4 or WebM up to 100 MB.',
  },
  {
    step: '03',
    icon: 'QrCodeIcon',
    title: 'Share & Scan',
    desc: 'Get a QR code and shareable link. Anyone can scan using a standard browser.',
  },
];

export default function UploadCreationPage() {
  return (
    <div className="min-h-screen bg-[#0A0B14] grid-bg flex flex-col">
      <Header />

      <main className="flex-1 pt-16">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
          {/* Background glow orbs */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(124,58,255,0.18) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.1) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          {/* Floating decoration cards */}
          <div
            className="absolute top-20 left-[5%] hidden lg:block animate-float-a pointer-events-none"
            aria-hidden="true"
          >
            <div className="glass px-4 py-3 rounded-xl border border-[rgba(124,58,255,0.2)] shadow-[0_0_20px_rgba(124,58,255,0.1)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7C3AFF] shadow-[0_0_8px_#7C3AFF]" />
                <span className="text-xs font-mono text-[#8B91B8]">target.mind</span>
              </div>
            </div>
          </div>
          <div
            className="absolute top-32 right-[6%] hidden lg:block animate-float-b pointer-events-none"
            aria-hidden="true"
          >
            <div className="glass px-4 py-3 rounded-xl border border-[rgba(0,212,255,0.2)] shadow-[0_0_20px_rgba(0,212,255,0.08)]">
              <div className="flex items-center gap-2">
                <Icon name="VideoCameraIcon" size={13} className="text-[#00D4FF]" />
                <span className="text-xs font-mono text-[#8B91B8]">ar_video.mp4</span>
              </div>
            </div>
          </div>
          <div
            className="absolute bottom-24 left-[8%] hidden lg:block animate-float-c pointer-events-none"
            aria-hidden="true"
          >
            <div className="glass px-4 py-3 rounded-xl border border-[rgba(0,212,255,0.15)]">
              <div className="flex items-center gap-2">
                <Icon name="QrCodeIcon" size={13} className="text-[#00D4FF]" />
                <span className="text-xs font-mono text-[#8B91B8]">QR ready</span>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(124,58,255,0.08)] border border-[rgba(124,58,255,0.2)] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AFF] animate-blink" />
              <span className="text-xs font-semibold text-[#9D6FFF] tracking-wide">No app download required</span>
            </div>

            <h1 className="font-heading font-extrabold text-[clamp(2.2rem,7vw,4rem)] leading-[1.05] tracking-tight text-[#F0F2FF] mb-5">
              Turn Any Sticker Into{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #7C3AFF 0%, #00D4FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Living AR
              </span>
            </h1>
            <p className="text-[#8B91B8] text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-3">
              Upload a target image + AR video. Get a QR code. Anyone with a smartphone
              can scan and watch your sticker come alive — no app required.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-[#4A5080]">
              <span className="flex items-center gap-1">
                <Icon name="BoltIcon" size={12} className="text-[#7C3AFF]" variant="solid" />
                Ready in ~60 seconds
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Icon name="DevicePhoneMobileIcon" size={12} className="text-[#00D4FF]" />
                Works on any phone
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Icon name="GlobeAltIcon" size={12} className="text-[#8B91B8]" />
                No install needed
              </span>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="px-4 sm:px-6 pb-10">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-3 mb-8">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="card p-4 text-center">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(124,58,255,0.1)] flex items-center justify-center mx-auto mb-3">
                    <Icon name={step.icon as any} size={18} className="text-[#7C3AFF]" />
                  </div>
                  <p className="font-mono text-[10px] text-[#4A5080] mb-1">{step.step}</p>
                  <p className="font-heading font-semibold text-xs text-[#F0F2FF] mb-1">{step.title}</p>
                  <p className="text-[10px] text-[#4A5080] leading-relaxed hidden sm:block">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Main Upload Panel ── */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-2xl mx-auto">
            <div className="glass-bright rounded-card p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
              <UploadCreationClient />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}