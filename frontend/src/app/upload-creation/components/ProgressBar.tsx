'use client';

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="space-y-2" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#8B91B8] font-medium">
          {label || (clampedProgress < 100 ? 'Uploading & processing…' : 'Complete!')}
        </span>
        <span className="font-mono font-bold text-[#7C3AFF]">{clampedProgress}%</span>
      </div>
      <div className="w-full h-2 bg-[rgba(124,58,255,0.12)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out progress-shimmer"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {clampedProgress < 100 && clampedProgress > 0 && (
        <p className="text-xs text-[#4A5080]">
          {clampedProgress < 60
            ? 'Uploading your files…'
            : clampedProgress < 90
            ? 'Generating AR target…' :'Almost ready…'}
        </p>
      )}
    </div>
  );
}