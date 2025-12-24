'use client';

import type { UserStats } from '@/types/profile';

interface ProfileStatsProps {
    stats: UserStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
    const winLossRatio = stats.total_losses > 0
        ? (stats.total_wins / stats.total_losses).toFixed(2)
        : stats.total_wins.toString();

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Win Rate */}
            <StatCard
                label="Win Rate"
                value={`${stats.win_rate}%`}
                icon="📈"
                color={stats.win_rate >= 60 ? 'green' : stats.win_rate >= 40 ? 'amber' : 'red'}
                detail={`${stats.total_wins}W / ${stats.total_losses}L / ${stats.total_draws}D`}
            />

            {/* Average Score */}
            <StatCard
                label="Avg Score"
                value={stats.avg_score.toString()}
                icon="🎯"
                color={stats.avg_score >= 75 ? 'green' : stats.avg_score >= 50 ? 'amber' : 'red'}
                detail="per case"
            />

            {/* Best Streak */}
            <StatCard
                label="Best Streak"
                value={stats.longest_streak.toString()}
                icon="🔥"
                color="amber"
                detail="consecutive wins"
            />

            {/* Evidence Win Rate */}
            <StatCard
                label="Evidence Impact"
                value={`${stats.evidence_win_rate}%`}
                icon="📎"
                color={stats.evidence_win_rate >= 70 ? 'green' : 'blue'}
                detail={`${stats.cases_with_evidence} cases w/ evidence`}
            />

            {/* Total Cases */}
            <StatCard
                label="Total Cases"
                value={stats.total_cases.toString()}
                icon="📋"
                color="violet"
                detail="disputes settled"
            />

            {/* W/L Ratio */}
            <StatCard
                label="W/L Ratio"
                value={winLossRatio}
                icon="⚖️"
                color={parseFloat(winLossRatio) >= 1 ? 'green' : 'red'}
                detail="wins per loss"
            />

            {/* Fallacies */}
            <StatCard
                label="Fallacies"
                value={stats.total_fallacies_detected.toString()}
                icon="⚠️"
                color={stats.total_fallacies_detected / Math.max(stats.total_cases, 1) < 1 ? 'green' : 'amber'}
                detail={`${(stats.total_fallacies_detected / Math.max(stats.total_cases, 1)).toFixed(1)} avg/case`}
            />

            {/* Current Streak */}
            <StatCard
                label="Current Streak"
                value={stats.current_streak.toString()}
                icon={stats.streak_type === 'win' ? '🔥' : stats.streak_type === 'loss' ? '❄️' : '➖'}
                color={stats.streak_type === 'win' ? 'green' : stats.streak_type === 'loss' ? 'red' : 'grey'}
                detail={stats.streak_type === 'none' ? 'no streak' : `${stats.streak_type} streak`}
            />
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    icon: string;
    color: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'grey';
    detail: string;
}

function StatCard({ label, value, icon, color, detail }: StatCardProps) {
    const colors = {
        green: {
            bg: 'bg-verdict-green/10',
            border: 'border-verdict-green/20',
            text: 'text-verdict-green',
            glow: 'hover:shadow-verdict-green-glow'
        },
        amber: {
            bg: 'bg-caution-amber/10',
            border: 'border-caution-amber/20',
            text: 'text-caution-amber',
            glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'
        },
        red: {
            bg: 'bg-objection-red/10',
            border: 'border-objection-red/20',
            text: 'text-objection-red',
            glow: 'hover:shadow-objection-red-glow'
        },
        blue: {
            bg: 'bg-cyber-blue/10',
            border: 'border-cyber-blue/20',
            text: 'text-cyber-blue',
            glow: 'hover:shadow-cyber-blue-glow'
        },
        violet: {
            bg: 'bg-electric-violet/10',
            border: 'border-electric-violet/20',
            text: 'text-electric-violet',
            glow: 'hover:shadow-electric-glow'
        },
        grey: {
            bg: 'bg-steel-grey/10',
            border: 'border-steel-grey/20',
            text: 'text-steel-grey',
            glow: ''
        }
    };

    const c = colors[color];

    return (
        <div className={`${c.bg} ${c.border} border rounded-2xl p-4 transition-all ${c.glow}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{icon}</span>
                <span className="text-steel-grey text-sm">{label}</span>
            </div>
            <div className={`text-3xl font-black ${c.text}`}>{value}</div>
            <div className="text-steel-grey/70 text-xs mt-1">{detail}</div>
        </div>
    );
}