'use client';

import { useUpload } from '@/hooks/useUpload';
import DropZone from './DropZone';
import OptionsPanel from './OptionsPanel';
import ProgressBar from './ProgressBar';
import SuccessPanel from './SuccessPanel';
import Icon from '@/components/ui/AppIcon';

export default function UploadCreationClient() {
  const { state, options, setOptions, setImageFile, setVideoFile, submit, reset } = useUpload();

  if (state?.result) {
    return <SuccessPanel result={state?.result} onReset={reset} />;
  }

  const canSubmit = !!state?.imageFile && !!state?.videoFile && !state?.uploading;

  return (
    <div className="space-y-6">
      {/* Upload Zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4A5080] mb-2 flex items-center gap-1.5">
            <Icon name="PhotoIcon" size={12} className="text-[#7C3AFF]" />
            Target Image
          </p>
          <DropZone
            type="image"
            preview={state?.imagePreview}
            fileName={state?.imageFile?.name}
            onFile={setImageFile}
            label="Target Image"
            subLabel="JPG, PNG or WebP · Max 15 MB"
            accept="image/jpeg,image/png,image/webp"
            icon="PhotoIcon"
            accentColor="violet"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4A5080] mb-2 flex items-center gap-1.5">
            <Icon name="VideoCameraIcon" size={12} className="text-[#00D4FF]" />
            AR Video
          </p>
          <DropZone
            type="video"
            preview={state?.videoPreview}
            fileName={state?.videoFile?.name}
            onFile={setVideoFile}
            label="AR Video"
            subLabel="MP4 or WebM · Max 100 MB"
            accept="video/mp4,video/webm"
            icon="VideoCameraIcon"
            accentColor="cyan"
          />
        </div>
      </div>
      {/* Options */}
      <OptionsPanel options={options} onChange={(o) => setOptions((prev) => ({ ...prev, ...o }))} />
      {/* Error */}
      {state?.error && (
        <div className="flex items-start gap-3 p-4 rounded-card bg-[rgba(255,80,80,0.08)] border border-[rgba(255,80,80,0.25)]">
          <Icon name="ExclamationTriangleIcon" size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{state?.error}</p>
        </div>
      )}
      {/* Progress */}
      {state?.uploading && (
        <div className="card p-4">
          <ProgressBar progress={state?.progress} />
        </div>
      )}
      {/* Submit */}
      <button
        onClick={submit}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-btn text-sm font-bold font-heading flex items-center justify-center gap-2.5 transition-all duration-300
          ${canSubmit
            ? 'btn-primary shadow-[0_0_30px_rgba(124,58,255,0.3)]'
            : 'bg-[rgba(124,58,255,0.15)] text-[#4A5080] cursor-not-allowed border border-[rgba(124,58,255,0.1)]'}`}
        aria-label="Generate AR sticker"
        aria-disabled={!canSubmit}
      >
        {state?.uploading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          <>
            <Icon name="SparklesIcon" size={16} variant="solid" />
            Generate AR Sticker
          </>
        )}
      </button>
      {/* File requirements hint */}
      {!state?.imageFile && !state?.videoFile && (
        <p className="text-center text-xs text-[#4A5080]">
          Upload a target image and an AR video to get started
        </p>
      )}
    </div>
  );
}