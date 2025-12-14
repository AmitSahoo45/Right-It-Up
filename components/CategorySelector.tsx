'use client';

import { CATEGORY_OPTIONS, JUDGE_PERSONAS } from '@/types';
import type { DisputeCategory, CategorySelectorProps } from '@/types';

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
    const selectedJudge = JUDGE_PERSONAS[value];
    
    return (
        <div>
            <label className="block text-sm font-medium text-steel-grey mb-3">
                Dispute Category
            </label>
            <p className="text-xs text-steel-grey/70 mb-3">
                Pick the type that best fits your argument
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
                {CATEGORY_OPTIONS.map((category) => (
                    <button
                        key={category.value}
                        type="button"
                        onClick={() => onChange(category.value)}
                        className={`relative p-3 rounded-xl border transition-all text-center group ${
                            value === category.value
                                ? 'bg-cyber-blue/20 border-cyber-blue shadow-cyber-blue-glow'
                                : 'bg-charcoal-layer/30 border-white/10 hover:border-cyber-blue/50 hover:bg-charcoal-layer/50'
                        }`}
                    >
                        {/* Selected indicator */}
                        {value === category.value && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyber-blue rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                            {category.icon}
                        </div>
                        <div className={`text-sm font-medium ${value === category.value ? 'text-cyber-blue' : 'text-starlight-white'}`}>
                            {category.label}
                        </div>
                    </button>
                ))}
            </div>
            
            {/* Selected Judge Preview */}
            {value !== 'general' && (
                <div className="flex items-center gap-3 p-3 bg-charcoal-layer/30 rounded-xl border border-white/5">
                    <div className="text-2xl">{selectedJudge.icon}</div>
                    <div>
                        <div className="text-starlight-white text-sm font-medium">{selectedJudge.name}</div>
                        <div className="text-steel-grey text-xs">Your specialized AI judge</div>
                    </div>
                </div>
            )}
        </div>
    );
}
