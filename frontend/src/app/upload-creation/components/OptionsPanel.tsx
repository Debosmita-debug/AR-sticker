'use client';

import { UploadOptions } from '@/hooks/useUpload';
import Icon from '@/components/ui/Appicon';

interface OptionsPanelProps {
  options: UploadOptions;
  onChange: (o: Partial<UploadOptions>) => void;
}

const EXPIRY_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: '0', label: 'Never' },
];

export default function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  return (
    <div className="card p-5 space-y-5">
      <h3 className="font-heading font-semibold text-[#F0F2FF] text-sm flex items-center gap-2">
        <Icon name="AdjustmentsHorizontalIcon" size={16} className="text-[#7C3AFF]" />
        Sticker Options
      </h3>

      {/* Loop Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#F0F2FF]">Loop video</p>
          <p className="text-xs text-[#4A5080] mt-0.5">Replay when target is held in view</p>
        </div>
        <button
          onClick={() => onChange({ loop: !options.loop })}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AFF] focus:ring-offset-2 focus:ring-offset-[#141628]
            ${options.loop ? 'bg-[#7C3AFF]' : 'bg-[#4A5080]'}`}
          role="switch"
          aria-checked={options.loop}
          aria-label="Toggle video loop"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
              ${options.loop ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      <div className="h-px bg-[rgba(124,58,255,0.1)]" />

      {/* Caption */}
      <div>
        <label className="text-sm font-medium text-[#F0F2FF] block mb-2">
          Caption <span className="text-[#4A5080] font-normal">(optional)</span>
        </label>
        <input
          type="text"
          className="input-field w-full px-3 py-2.5 text-sm"
          placeholder="e.g. Scan to unlock exclusive content 🎉"
          value={options.caption}
          maxLength={120}
          onChange={(e) => onChange({ caption: e.target.value })}
          aria-label="Caption for AR sticker"
        />
        <p className="text-xs text-[#4A5080] mt-1 text-right">{options.caption.length}/120</p>
      </div>

      {/* Password */}
      <div>
        <label className="text-sm font-medium text-[#F0F2FF] block mb-2 flex items-center gap-2">
          <Icon name="LockClosedIcon" size={13} className="text-[#8B91B8]" />
          Password protect <span className="text-[#4A5080] font-normal">(optional)</span>
        </label>
        <input
          type="password"
          className="input-field w-full px-3 py-2.5 text-sm"
          placeholder="Leave blank for public access"
          value={options.password}
          onChange={(e) => onChange({ password: e.target.value })}
          aria-label="Optional password for AR sticker"
          autoComplete="new-password"
        />
      </div>

      <div className="h-px bg-[rgba(124,58,255,0.1)]" />

      {/* Expiry */}
      <div>
        <label className="text-sm font-medium text-[#F0F2FF] block mb-2 flex items-center gap-2">
          <Icon name="ClockIcon" size={13} className="text-[#8B91B8]" />
          Expires after
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ expiryDays: opt.value })}
              className={`py-2 rounded-lg text-xs font-medium transition-all duration-200
                ${options.expiryDays === opt.value
                  ? 'bg-[#7C3AFF] text-white shadow-[0_0_15px_rgba(124,58,255,0.4)]'
                  : 'bg-[rgba(124,58,255,0.06)] text-[#8B91B8] border border-[rgba(124,58,255,0.15)] hover:bg-[rgba(124,58,255,0.12)] hover:text-[#F0F2FF]'
                }`}
              aria-pressed={options.expiryDays === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}