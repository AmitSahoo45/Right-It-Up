'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { EvidenceUploader } from './EvidenceUploader';
import { useAuth } from '@/contexts/AuthContext';
import { useHoneypot } from '@/hooks/useHoneypot';

import type { Case, ResponseFormData } from '@/types';
import { CATEGORY_OPTIONS, TONE_OPTIONS, JUDGE_PERSONAS } from '@/types';

interface CaseResponseFormProps {
    caseCode: string;
    caseData: Case;
}

export function CaseResponseForm({ caseCode, caseData }: CaseResponseFormProps) {
    const MIN_EVIDENCE_IMAGES = 3;

    const router = useRouter();
    const { user, quota, refreshQuota } = useAuth();
    const { HoneypotFields, getHoneypotData } = useHoneypot();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<ResponseFormData>({
        name: '',
        argument: '',
        evidenceText: [],
        evidenceImages: []
    });

    const category = CATEGORY_OPTIONS.find(c => c.value === caseData.category);
    const tone = TONE_OPTIONS.find(t => t.value === caseData.tone);
    const judge = JUDGE_PERSONAS[caseData.category];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim() || !isValidLength) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!hasMinimumEvidence) {
            toast.error(`Please upload at least ${MIN_EVIDENCE_IMAGES} evidence screenshots`);
            return;
        }

        setIsSubmitting(true);

        try {
            toast.loading('Submitting your response...', { id: 'submit-response', duration: 5000 });
            const response = await fetch(`/api/case/${caseCode}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    party_b_name: formData.name,
                    party_b_argument: formData.argument,
                    party_b_evidence_text: formData.evidenceText,
                    party_b_evidence_images: formData.evidenceImages,
                    ...getHoneypotData()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.status === 'blocked_quota') {
                    toast.error(data.error || 'Quota exceeded');
                    return;
                }
                throw new Error(data.error || 'Failed to submit response');
            }

            await refreshQuota();
            toast.success('Response submitted! Generating verdict...');

            // Always redirect to case page to show AnalyzingView with polling
            // The verdict is generated asynchronously in the background
            router.push(`/case/${caseCode}`);

        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong');
            setError('Something went wrong. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const characterCount = formData.argument.length;
    const isValidLength = characterCount >= 20 && characterCount <= 5000;
    const hasMinimumEvidence = formData.evidenceImages.length >= MIN_EVIDENCE_IMAGES;

    // Check if user can submit
    if (!user) {
        return (
            <div className="text-center">
                <div className="text-6xl mb-6">🔐</div>
                <h1 className="text-3xl font-black text-starlight-white mb-4">
                    Sign In Required
                </h1>
                <p className="text-steel-grey mb-8">
                    Please sign in to respond to this case. You&apos;ll get 5 verdicts per day!
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold rounded-xl hover:shadow-electric-glow transition-all"
                >
                    Sign In to Continue
                </Link>
            </div>
        );
    }

    if (!quota.can_use) {
        return (
            <div className="text-center">
                <div className="text-6xl mb-6">🚫</div>
                <h1 className="text-3xl font-black text-starlight-white mb-4">
                    Daily Limit Reached
                </h1>
                <p className="text-steel-grey mb-8">
                    You&apos;ve used all 5 verdicts for today. Come back tomorrow!
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue/20 text-cyber-blue text-sm font-bold rounded-full mb-4">
                    <span>⚔️</span>
                    <span>SOMEONE CHALLENGED YOU</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-starlight-white mb-4">
                    Your Turn to Respond
                </h1>
                <p className="text-steel-grey text-lg">
                    <span className="text-electric-violet font-bold">{caseData.party_a_name}</span> has filed a case against you
                </p>
            </div>

            {/* Case Info Card */}
            <div className="bg-charcoal-layer/50 border border-white/10 rounded-2xl p-6 mb-8">
                {/* Case code - top on mobile */}
                <div className="text-steel-grey text-xs mb-3 sm:hidden">Case #{caseCode}</div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Judge info */}
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">{judge.icon}</div>
                        <div>
                            <div className="text-starlight-white font-bold">{judge.name}</div>
                            <div className="text-steel-grey text-sm">will judge this case</div>
                        </div>
                    </div>

                    {/* Case details */}
                    <div className="sm:text-right mb-3">
                        <div className="text-steel-grey text-xs hidden sm:block mb-1.5">Case #{caseCode}</div>
                        <div className="flex flex-wrap items-center gap-2 sm:mt-1 sm:justify-end">
                            <span className="text-xs px-2 py-0.5 bg-cyber-blue/20 text-cyber-blue rounded-full">
                                {category?.icon} {category?.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-electric-violet/20 text-electric-violet rounded-full">
                                {tone?.icon} {tone?.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* No Peeking Notice */}
                <div className="p-4 bg-caution-amber/10 border border-caution-amber/30 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🙈</span>
                        <div>
                            <div className="text-caution-amber font-bold text-sm mb-1">No Peeking!</div>
                            <div className="text-steel-grey text-sm">
                                You can&apos;t see {caseData.party_a_name}&apos;s argument until both sides submit.
                                This ensures fairness!
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Response Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <HoneypotFields />

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-objection-red/10 border border-objection-red/30 rounded-xl">
                        <p className="text-objection-red text-sm">{error}</p>
                    </div>
                )}

                {/* Name Input */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-steel-grey mb-2">
                        Your Name / Handle
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="@your_handle or just your name"
                        className="w-full px-4 py-3 bg-charcoal-layer/50 border border-white/10 rounded-xl text-starlight-white placeholder:text-steel-grey/50 focus:outline-none focus:border-cyber-blue/50 focus:ring-1 focus:ring-cyber-blue/50 transition-all"
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
                        placeholder="Defend yourself! Explain your perspective, provide context, and make your case..."
                        rows={8}
                        className="w-full px-4 py-3 bg-charcoal-layer/50 border border-white/10 rounded-xl text-starlight-white placeholder:text-steel-grey/50 focus:outline-none focus:border-cyber-blue/50 focus:ring-1 focus:ring-cyber-blue/50 transition-all resize-none"
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
                    className="w-full py-4 bg-gradient-to-r from-cyber-blue to-verdict-green text-white font-bold text-lg rounded-xl shadow-cyber-blue-glow hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Submitting & Generating Verdict...
                        </span>
                    ) : !hasMinimumEvidence ? (
                        <span className="flex items-center justify-center gap-2">
                            📷 Upload {MIN_EVIDENCE_IMAGES - formData.evidenceImages.length} More Evidence Screenshot{MIN_EVIDENCE_IMAGES - formData.evidenceImages.length !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            ⚖️ Submit & Get Verdict
                        </span>
                    )}
                </button>

                {/* Evidence requirement reminder */}
                {!hasMinimumEvidence && (
                    <p className="text-center text-caution-amber text-sm">
                        ⚠️ Evidence screenshots are required. Text alone can be fabricated.
                    </p>
                )}

                {/* Quota Info */}
                <div className="text-center">
                    <p className="text-steel-grey text-xs">
                        This will use 1 verdict from your quota ({quota.remaining} remaining)
                    </p>
                </div>
            </form>
        </div>
    );
}