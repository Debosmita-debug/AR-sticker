import React from 'react';
import Icon from '@/components/ui/Appicon';

interface OptionsPanelProps {
    options: Record<string, any>;
    onChange: (updates: Record<string, any>) => void;
}

export default function OptionsPanel({ options, onChange }: OptionsPanelProps) {
    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon name="Cog6ToothIcon" size={16} className="text-[#8B91B8]" />
                    <h3 className="text-sm font-semibold text-[#F0F2FF]">AR Options</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Caption */}
                <div>
                    <label className="block text-xs font-semibold text-[#8B91B8] mb-1.5 uppercase tracking-wide">Caption (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. Happy Birthday!"
                        className="input-field w-full px-3 py-2 text-sm"
                        value={options.caption || ''}
                        onChange={(e) => onChange({ caption: e.target.value })}
                    />
                </div>

                {/* Play Options */}
                <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <input
                            type="checkbox"
                            checked={options.loop !== false}
                            onChange={(e) => onChange({ loop: e.target.checked })}
                            className="w-4 h-4 rounded border-[#4A5080] text-[#7C3AFF] bg-transparent focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-sm text-[#F0F2FF]">Loop video playback</span>
                    </label>
                </div>
            </div>
        </div>
    );
}