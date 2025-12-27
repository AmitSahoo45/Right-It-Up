'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppealModal } from './AppealModal';
import { AppealResult, AppealStatusPoller } from './AppealResult';
import type { Appeal } from '@/types/appeals';

interface AppealsSectionProps {
    caseCode: string;
    partyAName: string;
    partyBName: string;
    userId?: string;
    partyAId?: string | null;
    partyBId?: string | null;
}

interface AppealStatus {
    canAppealAsPartyA: boolean;
    canAppealAsPartyB: boolean;
    partyAAppealed: boolean;
    partyBAppealed: boolean;
    appeals: Appeal[];
    userIsPartyA: boolean;
    userIsPartyB: boolean;
}

export function AppealsSection({
    caseCode,
    partyAName,
    partyBName,
    userId,
    partyAId,
    partyBId
}: AppealsSectionProps) {
    const [appealStatus, setAppealStatus] = useState<AppealStatus | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalParty, setModalParty] = useState<'partyA' | 'partyB'>('partyA');
    const [isLoading, setIsLoading] = useState(true);

    const fetchAppealStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/appeal/status/${caseCode}`);
            const data = await response.json();

            if (data.success) {
                setAppealStatus({
                    canAppealAsPartyA: data.canAppealAsPartyA,
                    canAppealAsPartyB: data.canAppealAsPartyB,
                    partyAAppealed: data.partyAAppealed,
                    partyBAppealed: data.partyBAppealed,
                    appeals: data.appeals || [],
                    userIsPartyA: data.userIsPartyA,
                    userIsPartyB: data.userIsPartyB
                });
            }
        } catch (error) {
            console.error('[Appeals] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [caseCode]);

    useEffect(() => {
        fetchAppealStatus();
    }, [fetchAppealStatus]);

    const handleOpenAppeal = (party: 'partyA' | 'partyB') => {
        setModalParty(party);
        setShowModal(true);
    };

    const handleAppealSubmitted = (appeal: Appeal) => {
        setAppealStatus(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                appeals: [appeal, ...prev.appeals],
                canAppealAsPartyA: prev.canAppealAsPartyA && appeal.appealing_party !== 'partyA',
                canAppealAsPartyB: prev.canAppealAsPartyB && appeal.appealing_party !== 'partyB',
                partyAAppealed: prev.partyAAppealed || appeal.appealing_party === 'partyA',
                partyBAppealed: prev.partyBAppealed || appeal.appealing_party === 'partyB'
            };
        });
    };

    const handleAppealsUpdate = (appeals: Appeal[]) => {
        setAppealStatus(prev => prev ? { ...prev, appeals } : prev);
    };

    if (isLoading) {
        return (
            <div className="mt-8 bg-charcoal-layer/30 border border-white/5 rounded-2xl p-6">
                <div className="animate-pulse flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
                    <div className="h-5 bg-white/10 rounded w-32"></div>
                </div>
            </div>
        );
    }

    if (!appealStatus) return null;

    const canAppeal = appealStatus.canAppealAsPartyA || appealStatus.canAppealAsPartyB;
    const hasAppeals = appealStatus.appeals.length > 0;
    const hasPendingAppeals = appealStatus.appeals.some(
        a => a.status === 'pending' || a.status === 'processing'
    );

    if (!userId && !hasAppeals) return null;
    if (userId && !appealStatus.userIsPartyA && !appealStatus.userIsPartyB && !hasAppeals) return null;

    return (
        <>
            <section className="mt-8">
                <div className="bg-charcoal-layer/30 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚖️</span>
                            <div>
                                <h3 className="text-lg font-bold text-starlight-white">Appeals</h3>
                                <p className="text-sm text-steel-grey">Each party gets one appeal</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${appealStatus.partyAAppealed
                                ? 'bg-electric-violet/20 text-electric-violet'
                                : 'bg-white/5 text-steel-grey'
                                }`}>
                                {partyAName}: {appealStatus.partyAAppealed ? 'Appealed' : 'Available'}
                            </span>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${appealStatus.partyBAppealed
                                ? 'bg-electric-violet/20 text-electric-violet'
                                : 'bg-white/5 text-steel-grey'
                                }`}>
                                {partyBName}: {appealStatus.partyBAppealed ? 'Appealed' : 'Available'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {canAppeal && (
                            <div className="flex gap-3">
                                {appealStatus.canAppealAsPartyA && (
                                    <button
                                        onClick={() => handleOpenAppeal('partyA')}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-objection-red/20 to-electric-violet/20 border border-objection-red/30 text-starlight-white font-medium rounded-xl hover:border-objection-red/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>📝</span>
                                        File Appeal as {partyAName}
                                    </button>
                                )}
                                {appealStatus.canAppealAsPartyB && (
                                    <button
                                        onClick={() => handleOpenAppeal('partyB')}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-objection-red/20 to-electric-violet/20 border border-objection-red/30 text-starlight-white font-medium rounded-xl hover:border-objection-red/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>📝</span>
                                        File Appeal as {partyBName}
                                    </button>
                                )}
                            </div>
                        )}

                        {!canAppeal && !hasAppeals && userId && (
                            <div className="text-center py-4 text-steel-grey">
                                No appeals available.
                            </div>
                        )}

                        {hasAppeals && (
                            <div className="space-y-3">
                                {appealStatus.appeals.map((appeal) => (
                                    <AppealResult
                                        key={appeal.id}
                                        appeal={appeal}
                                        partyAName={partyAName}
                                        partyBName={partyBName}
                                    />
                                ))}
                            </div>
                        )}

                        {!userId && canAppeal && (
                            <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-xl p-4 text-center">
                                <p className="text-cyber-blue text-sm">
                                    <a href="/login" className="underline font-medium">Sign in</a> to file an appeal
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {hasPendingAppeals && (
                <AppealStatusPoller caseCode={caseCode} onUpdate={handleAppealsUpdate} />
            )}

            <AppealModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                caseCode={caseCode}
                appealingParty={modalParty}
                partyName={modalParty === 'partyA' ? partyAName : partyBName}
                onAppealSubmitted={handleAppealSubmitted}
            />
        </>
    );
}