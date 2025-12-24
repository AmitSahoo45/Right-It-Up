'use client';

import type { UserStats, CategoryStats } from '@/types/profile';
import { CATEGORY_OPTIONS } from '@/types';

interface ProfileCategoryBreakdownProps {
    stats: UserStats;
}

export function ProfileCategoryBreakdown({ stats }: ProfileCategoryBreakdownProps) {
    const categoryStats = stats.category_stats as CategoryStats;
    
    // Sort categories by total cases
    const sortedCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.total - a.total)
        .filter(([, stat]) => stat.total > 0);

    if (sortedCategories.length === 0) {
        return null;
    }

    return (
        <div className="bg-charcoal-layer/30 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-starlight-white mb-6 flex items-center gap-2">
                <span>📊</span> Performance by Category
            </h2>

            <div className="space-y-4">
                {sortedCategories.map(([category, stat]) => {
                    const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === category);
                    const winRate = stat.total > 0 
                        ? Math.round((stat.wins / stat.total) * 100) 
                        : 0;

                    return (
                        <CategoryRow
                            key={category}
                            icon={categoryInfo?.icon || '⚖️'}
                            label={categoryInfo?.label || category}
                            wins={stat.wins}
                            losses={stat.losses}
                            draws={stat.draws}
                            total={stat.total}
                            winRate={winRate}
                        />
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-verdict-green"></div>
                    <span className="text-steel-grey">Wins</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-objection-red"></div>
                    <span className="text-steel-grey">Losses</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-caution-amber"></div>
                    <span className="text-steel-grey">Draws</span>
                </div>
            </div>
        </div>
    );
}

interface CategoryRowProps {
    icon: string;
    label: string;
    wins: number;
    losses: number;
    draws: number;
    total: number;
    winRate: number;
}

function CategoryRow({ icon, label, wins, losses, draws, total, winRate }: CategoryRowProps) {
    const winPercent = total > 0 ? (wins / total) * 100 : 0;
    const lossPercent = total > 0 ? (losses / total) * 100 : 0;
    const drawPercent = total > 0 ? (draws / total) * 100 : 0;

    return (
        <div className="group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-starlight-white font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-steel-grey">
                        {total} case{total !== 1 ? 's' : ''}
                    </span>
                    <span className={`font-bold ${winRate >= 50 ? 'text-verdict-green' : 'text-objection-red'}`}>
                        {winRate}% WR
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-charcoal-layer rounded-full overflow-hidden flex">
                {winPercent > 0 && (
                    <div
                        className="h-full bg-verdict-green transition-all"
                        style={{ width: `${winPercent}%` }}
                        title={`${wins} wins`}
                    />
                )}
                {lossPercent > 0 && (
                    <div
                        className="h-full bg-objection-red transition-all"
                        style={{ width: `${lossPercent}%` }}
                        title={`${losses} losses`}
                    />
                )}
                {drawPercent > 0 && (
                    <div
                        className="h-full bg-caution-amber transition-all"
                        style={{ width: `${drawPercent}%` }}
                        title={`${draws} draws`}
                    />
                )}
            </div>

            {/* Hover details */}
            <div className="hidden group-hover:flex items-center gap-4 mt-2 text-xs text-steel-grey">
                <span className="text-verdict-green">{wins}W</span>
                <span className="text-objection-red">{losses}L</span>
                <span className="text-caution-amber">{draws}D</span>
            </div>
        </div>
    );
}