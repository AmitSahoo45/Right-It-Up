'use client';

import { useState, useEffect } from 'react';
import type { Appeal } from '@/types/appeals';

interface AppealResultProps {
    appeal: Appeal;
    partyAName: string;
    partyBName: string;
}

export function AppealResult({ appeal, partyAName, partyBName }: AppealResultProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const appellantName = appeal.appealing_party === 'partyA' ? partyAName : partyBName;
    
    const statusColors: Record<string, string> = {
        pending: 'bg-caution-amber/20 text-caution-amber border-caution-amber/30',
        processing: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30',
        completed: appeal.verdict_changed
            ? 'bg-verdict-green/20 text-verdict-green border-verdict-green/30'
            : 'bg-electric-violet/20 text-electric-violet border-electric-violet/30',
        rejected: 'bg-objection-red/20 text-objection-red border-objection-red/30'
    };

    const statusIcons: Record<string, string> = {
        pending: '⏳',
        processing: '🔄',
        completed: appeal.verdict_changed ? '✅' : '⚖️',
        rejected: '❌'
    };

    const statusLabels: Record<string, string> = {
        pending: 'Appeal Pending',
        processing: 'Processing...',
        completed: appeal.verdict_changed ? 'Verdict Overturned!' : 'Verdict Upheld',
        rejected: 'Appeal Rejected'
    };

    return (
        <div className="bg-charcoal-layer/50 border border-white/10 rounded-2xl overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">{statusIcons[appeal.status]}</span>
                    <div className="text-left">
                        <div className="font-semibold text-starlight-white">Appeal by {appellantName}</div>
                        <div className="text-sm text-steel-grey">
                            {new Date(appeal.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColors[appeal.status]}`}>
                        {statusLabels[appeal.status]}
                    </span>
                    <span className={`text-steel-grey transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </button>

            {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/10">
                    <div className="pt-4">
                        <div className="text-xs font-semibold text-steel-grey mb-2">APPEAL REASON</div>
                        <p className="text-starlight-white text-sm leading-relaxed">{appeal.reason}</p>
                    </div>

                    {appeal.new_evidence_text && (
                        <div>
                            <div className="text-xs font-semibold text-verdict-green mb-2">NEW EVIDENCE</div>
                            <p className="text-starlight-white text-sm bg-verdict-green/10 rounded-xl p-3 border border-verdict-green/20">
                                {appeal.new_evidence_text}
                            </p>
                        </div>
                    )}

                    {appeal.status === 'completed' && appeal.appeal_verdict && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-deep-space/50 rounded-xl p-4">
                                    <div className="text-xs font-semibold text-steel-grey mb-3">ORIGINAL</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-starlight-white">{partyAName}</span>
                                            <span className={`font-bold ${appeal.original_winner === 'partyA' ? 'text-verdict-green' : 'text-steel-grey'}`}>
                                                {appeal.original_party_a_score}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-starlight-white">{partyBName}</span>
                                            <span className={`font-bold ${appeal.original_winner === 'partyB' ? 'text-verdict-green' : 'text-steel-grey'}`}>
                                                {appeal.original_party_b_score}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`rounded-xl p-4 ${appeal.verdict_changed ? 'bg-verdict-green/10 border border-verdict-green/30' : 'bg-deep-space/50'}`}>
                                    <div className="text-xs font-semibold text-steel-grey mb-3">
                                        {appeal.verdict_changed ? '🔄 REVISED' : 'UNCHANGED'}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-starlight-white">{partyAName}</span>
                                            <span className={`font-bold ${appeal.new_winner === 'partyA' ? 'text-verdict-green' : 'text-steel-grey'}`}>
                                                {appeal.new_party_a_score}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-starlight-white">{partyBName}</span>
                                            <span className={`font-bold ${appeal.new_winner === 'partyB' ? 'text-verdict-green' : 'text-steel-grey'}`}>
                                                {appeal.new_party_b_score}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {appeal.change_summary && (
                                <div className={`rounded-xl p-4 ${appeal.verdict_changed ? 'bg-verdict-green/10 border border-verdict-green/30' : 'bg-electric-violet/10 border border-electric-violet/30'}`}>
                                    <div className="text-xs font-semibold mb-2" style={{ color: appeal.verdict_changed ? '#00D26A' : '#9333EA' }}>
                                        {appeal.verdict_changed ? '📝 WHY IT CHANGED' : '📝 WHY IT STANDS'}
                                    </div>
                                    <p className="text-starlight-white text-sm leading-relaxed">{appeal.change_summary}</p>
                                </div>
                            )}
                        </>
                    )}

                    {appeal.status === 'processing' && (
                        <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-xl p-4 flex items-center gap-3">
                            <span className="animate-spin text-xl">🔄</span>
                            <div>
                                <div className="text-cyber-blue font-semibold">Under Review</div>
                                <div className="text-steel-grey text-sm">AI is evaluating your appeal...</div>
                            </div>
                        </div>
                    )}

                    {appeal.status === 'pending' && (
                        <div className="bg-caution-amber/10 border border-caution-amber/30 rounded-xl p-4 flex items-center gap-3">
                            <span className="text-xl">⏳</span>
                            <div>
                                <div className="text-caution-amber font-semibold">Submitted</div>
                                <div className="text-steel-grey text-sm">Your appeal is in queue.</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function AppealStatusPoller({
    caseCode,
    onUpdate
}: {
    caseCode: string;
    onUpdate: (appeals: Appeal[]) => void;
}) {
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/appeal/${caseCode}`);
                const data = await response.json();

                if (data.success && data.appeals) {
                    onUpdate(data.appeals);
                    const hasPending = data.appeals.some(
                        (a: Appeal) => a.status === 'pending' || a.status === 'processing'
                    );
                    if (!hasPending) clearInterval(intervalId);
                }
            } catch (error) {
                console.error('[Appeal] Polling error:', error);
            }
        };

        intervalId = setInterval(pollStatus, 5000);
        return () => clearInterval(intervalId);
    }, [caseCode, onUpdate]);

    return null;
}