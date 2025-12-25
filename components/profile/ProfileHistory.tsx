'use client';

import Link from 'next/link';
import type { CaseHistoryEntry } from '@/types/profile';
import { CATEGORY_OPTIONS } from '@/types';

interface ProfileHistoryProps {
    history: CaseHistoryEntry[];
}

export function ProfileHistory({ history }: ProfileHistoryProps) {
    if (history.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-bold text-starlight-white mb-2">No History Yet</h3>
                <p className="text-steel-grey">Your case history will appear here after your first verdict.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {history.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} />
            ))}
        </div>
    );
}

function HistoryCard({ entry }: { entry: CaseHistoryEntry }) {
    const category = CATEGORY_OPTIONS.find(c => c.value === entry.category);

    const outcomeConfig = {
        win: {
            bg: 'bg-verdict-green/10',
            border: 'border-verdict-green/30',
            text: 'text-verdict-green',
            label: '🏆 WIN',
            badgeBg: 'bg-verdict-green/20'
        },
        loss: {
            bg: 'bg-objection-red/10',
            border: 'border-objection-red/30',
            text: 'text-objection-red',
            label: '❌ LOSS',
            badgeBg: 'bg-objection-red/20'
        },
        draw: {
            bg: 'bg-caution-amber/10',
            border: 'border-caution-amber/30',
            text: 'text-caution-amber',
            label: '🤝 DRAW',
            badgeBg: 'bg-caution-amber/20'
        }
    };

    const config = outcomeConfig[entry.outcome];
    const dateFormatted = new Date(entry.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <Link href={`/verdict/${entry.case_code}`}>
            <div className={`${config.bg} ${config.border} border rounded-2xl p-4 hover:scale-[1.01] transition-all cursor-pointer mb-3`}>
                <div className="flex items-center justify-between mb-3">
                    {/* Outcome badge */}
                    <span className={`${config.badgeBg} ${config.text} px-3 py-1 rounded-full text-xs font-bold`}>
                        {config.label}
                    </span>

                    {/* Date */}
                    <span className="text-steel-grey text-xs">{dateFormatted}</span>
                </div>

                <div className="flex items-center justify-between">
                    {/* Case info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-steel-grey text-xs font-mono">{entry.case_code}</span>
                            <span className="text-steel-grey/50">•</span>
                            <span className="text-steel-grey text-xs">{category?.icon} {category?.label}</span>
                        </div>
                        <div className="text-starlight-white font-medium">
                            vs <span className="text-electric-violet">{entry.opponent_name}</span>
                        </div>
                    </div>

                    {/* Scores */}
                    <div className="text-right">
                        <div className={`text-2xl font-black ${config.text}`}>
                            {entry.score}
                        </div>
                        <div className="text-steel-grey text-xs">
                            vs {entry.opponent_score}
                        </div>
                    </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    {entry.had_evidence && (
                        <span className="text-cyber-blue text-xs flex items-center gap-1">
                            <span>📎</span> With evidence
                        </span>
                    )}
                    {entry.fallacies_count > 0 && (
                        <span className="text-caution-amber text-xs flex items-center gap-1">
                            <span>⚠️</span> {entry.fallacies_count} fallac{entry.fallacies_count === 1 ? 'y' : 'ies'}
                        </span>
                    )}
                    <span className="text-steel-grey text-xs ml-auto">
                        {entry.role === 'party_a' ? 'Started case' : 'Responded'}
                    </span>
                </div>
            </div>
        </Link>
    );
}