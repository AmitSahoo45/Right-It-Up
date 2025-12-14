'use client';

import { TONE_OPTIONS } from '@/types';
import type { VerdictTone, ToneSelectorProps } from '@/types';

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-steel-grey mb-3">
                Verdict Vibe ✨
            </label>
            <p className="text-xs text-steel-grey/70 mb-3">
                How should the AI deliver the ruling?
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {TONE_OPTIONS.map((tone) => (
                    <button
                        key={tone.value}
                        type="button"
                        onClick={() => onChange(tone.value)}
                        className={`relative p-3 rounded-xl border transition-all text-center group ${
                            value === tone.value
                                ? 'bg-electric-violet/20 border-electric-violet shadow-electric-glow'
                                : 'bg-charcoal-layer/30 border-white/10 hover:border-electric-violet/50 hover:bg-charcoal-layer/50'
                        }`}
                    >
                        {/* Selected indicator */}
                        {value === tone.value && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-electric-violet rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                            {tone.icon}
                        </div>
                        <div className={`text-sm font-medium ${value === tone.value ? 'text-electric-violet' : 'text-starlight-white'}`}>
                            {tone.label}
                        </div>
                        <div className="text-[10px] text-steel-grey mt-0.5 hidden sm:block">
                            {tone.description}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
