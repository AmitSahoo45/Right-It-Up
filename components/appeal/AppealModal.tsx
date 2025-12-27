'use client';

import { useState, useRef } from 'react';
import type { Appeal } from '@/types/appeals';

interface AppealModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseCode: string;
    appealingParty: 'partyA' | 'partyB';
    partyName: string;
    onAppealSubmitted: (appeal: Appeal) => void;
}

export function AppealModal({
    isOpen,
    onClose,
    caseCode,
    appealingParty,
    partyName,
    onAppealSubmitted
}: AppealModalProps) {
    const [reason, setReason] = useState('');
    const [newEvidence, setNewEvidence] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (reason.trim().length < 20) {
            setError('Please provide a more detailed reason (at least 20 characters)');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseCode,
                    appealingParty,
                    reason: reason.trim(),
                    newEvidenceText: newEvidence.trim() || undefined
                })
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Failed to submit appeal');
                return;
            }

            // Trigger appeal processing
            fetch(`/api/appeal/process/${data.appealId}`, { method: 'POST' }).catch(console.error);

            onAppealSubmitted({
                id: data.appealId,
                case_id: '',
                appealing_party: appealingParty,
                appellant_id: null,
                reason: reason.trim(),
                new_evidence_text: newEvidence.trim() || null,
                new_evidence_images: [],
                original_verdict: {} as any,
                original_winner: '',
                original_party_a_score: 0,
                original_party_b_score: 0,
                appeal_verdict: null,
                new_winner: null,
                new_party_a_score: null,
                new_party_b_score: null,
                verdict_changed: false,
                change_summary: null,
                status: 'pending',
                created_at: new Date().toISOString(),
                processed_at: null
            });

            onClose();
        } catch (err) {
            console.error('[Appeal] Submit error:', err);
            setError('Failed to submit appeal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="w-full max-w-lg bg-deep-space border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-objection-red/20 to-electric-violet/20 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚖️</span>
                            <div>
                                <h2 className="text-lg font-bold text-starlight-white">File an Appeal</h2>
                                <p className="text-sm text-steel-grey">As {partyName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-steel-grey hover:text-starlight-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-caution-amber/10 border border-caution-amber/30 rounded-xl p-4">
                        <div className="flex gap-3">
                            <span className="text-lg">⚠️</span>
                            <div className="text-sm text-caution-amber">
                                <strong>One appeal per party.</strong> Make it count!
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-starlight-white mb-2">
                            Reason for Appeal <span className="text-objection-red">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you believe the verdict was unfair..."
                            className="w-full h-32 px-4 py-3 bg-charcoal-layer border border-white/10 rounded-xl text-starlight-white placeholder-steel-grey/50 focus:outline-none focus:border-electric-violet/50 resize-none"
                            required
                            minLength={20}
                        />
                        <p className="mt-1 text-xs text-steel-grey">{reason.length}/20 minimum</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-starlight-white mb-2">
                            New Evidence <span className="text-steel-grey">(optional)</span>
                        </label>
                        <textarea
                            value={newEvidence}
                            onChange={(e) => setNewEvidence(e.target.value)}
                            placeholder="Provide any new evidence..."
                            className="w-full h-28 px-4 py-3 bg-charcoal-layer border border-white/10 rounded-xl text-starlight-white placeholder-steel-grey/50 focus:outline-none focus:border-verdict-green/50 resize-none"
                        />
                        <p className="mt-1 text-xs text-verdict-green">💡 Appeals with new evidence are more likely to succeed</p>
                    </div>

                    {error && (
                        <div className="bg-objection-red/10 border border-objection-red/30 rounded-xl p-4 text-sm text-objection-red">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-charcoal-layer text-steel-grey font-medium rounded-xl hover:bg-charcoal-layer/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || reason.trim().length < 20}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-objection-red to-electric-violet text-white font-bold rounded-xl hover:shadow-electric-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}