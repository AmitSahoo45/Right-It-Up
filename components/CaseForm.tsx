'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { ToneSelector } from './ToneSelector';
import { CategorySelector } from './CategorySelector';
import { EvidenceUploader } from './EvidenceUploader';
import { HoneypotFields, HoneypotValues } from './HoneypotFields';
import type { VerdictTone, DisputeCategory, CaseFormData } from '@/types';

export function CaseForm() {
    const MIN_EVIDENCE_IMAGES = 3;
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CaseFormData>({
        category: 'general',
        tone: 'neutral',
        name: '',
        argument: '',
        evidenceText: [],
        evidenceImages: []
    });

    // Honeypot state for bot detection
    const [honeypotValues, setHoneypotValues] = useState<HoneypotValues>({});
    const handleHoneypotChange = useCallback((values: HoneypotValues) => {
        setHoneypotValues(values);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (!formData.name.trim() || !isValidLength) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!hasMinimumEvidence) {
            toast.error(`Please upload at least ${MIN_EVIDENCE_IMAGES} evidence screenshots`);
            return;
        }

        try {
            const response = await fetch('/api/case', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: formData.category,
                    tone: formData.tone,
                    party_a_name: formData.name,
                    party_a_argument: formData.argument,
                    party_a_evidence_text: formData.evidenceText,
                    party_a_evidence_images: formData.evidenceImages,
                    // Include honeypot fields for bot detection
                    ...honeypotValues
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || 'Failed to create case');
                toast.error('Failed to create case. Please try again.');
                return;
            }

            toast.success('Case created! Share the link with your opponent.');
            router.push(`/case/${data.code}?created=true`);

        } catch (err) {
            setError('Something went wrong. Please try again.');
            toast.error('Something went wrong. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const characterCount = formData.argument.length;
    const isValidLength = characterCount >= 20 && characterCount <= 5000;
    const hasMinimumEvidence = formData.evidenceImages.length >= MIN_EVIDENCE_IMAGES;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot fields for bot detection */}
            <HoneypotFields onValuesChange={handleHoneypotChange} />

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-objection-red/10 border border-objection-red/30 rounded-xl">
                    <p className="text-objection-red text-sm">{error}</p>
                </div>
            )}

            {/* Category Selection */}
            <CategorySelector
                value={formData.category}
                onChange={(category: DisputeCategory) => setFormData(prev => ({ ...prev, category }))}
            />

            {/* Tone Selection */}
            <ToneSelector
                value={formData.tone}
                onChange={(tone: VerdictTone) => setFormData(prev => ({ ...prev, tone }))}
            />

            {/* Name Input */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-steel-grey mb-2">
                    Your Name or Handle
                </label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="@your_handle or just your name"
                    className="w-full px-4 py-3 bg-charcoal-layer/50 border border-white/10 rounded-xl text-starlight-white placeholder:text-steel-grey/50 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 transition-all"
                    required
                    maxLength={100}
                />
            </div>

            {/* Argument Textarea */}
            <div>
                <label htmlFor="argument" className="block text-sm font-medium text-steel-grey mb-2">
                    Your Side of the Story
                </label>
                <textarea
                    id="argument"
                    value={formData.argument}
                    onChange={(e) => setFormData(prev => ({ ...prev, argument: e.target.value }))}
                    placeholder="Explain your side of the argument. Be specific, include context, and make your case clear..."
                    rows={8}
                    className="w-full px-4 py-3 bg-charcoal-layer/50 border border-white/10 rounded-xl text-starlight-white placeholder:text-steel-grey/50 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 transition-all resize-none"
                    required
                    maxLength={5000}
                />
                <div className="flex justify-between mt-2 text-xs">
                    <span className={characterCount < 20 ? 'text-caution-amber' : 'text-steel-grey'}>
                        {characterCount < 20 && `${20 - characterCount} more characters needed`}
                    </span>
                    <span className={characterCount > 4500 ? 'text-caution-amber' : 'text-steel-grey'}>
                        {characterCount}/5000
                    </span>
                </div>
            </div>

            {/* Evidence Section */}
            <EvidenceUploader
                textEvidence={formData.evidenceText}
                imageEvidence={formData.evidenceImages}
                onTextChange={(evidence) => setFormData(prev => ({ ...prev, evidenceText: evidence }))}
                onImageChange={(evidence) => setFormData(prev => ({ ...prev, evidenceImages: evidence }))}
                minImages={MIN_EVIDENCE_IMAGES}
                maxImages={5}
            />

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim() || !isValidLength || !hasMinimumEvidence}
                className="w-full py-4 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold text-lg rounded-xl shadow-electric-glow hover:shadow-[0_0_40px_rgba(124,58,237,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Case...
                    </span>
                ) : !hasMinimumEvidence ? (
                    <span className="flex items-center justify-center gap-2">
                        📷 Upload {MIN_EVIDENCE_IMAGES - formData.evidenceImages.length} More Evidence Screenshot{MIN_EVIDENCE_IMAGES - formData.evidenceImages.length !== 1 ? 's' : ''}
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        🚀 Create Case & Get Link
                    </span>
                )}
            </button>

            {/* Evidence requirement reminder */}
            {!hasMinimumEvidence && (
                <p className="text-center text-caution-amber text-sm">
                    ⚠️ Evidence screenshots are required. Text alone can be fabricated.
                </p>
            )}

            {/* Disclaimer */}
            <p className="text-center text-steel-grey text-xs">
                By submitting, you agree that AI verdicts are for entertainment purposes only.
                Don&apos;t sue us. 🙃
            </p>
        </form>
    );
}
