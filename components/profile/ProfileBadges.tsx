'use client';

import type { UserBadge } from '@/types/profile';
import { BADGE_DEFINITIONS, TIER_COLORS } from '@/types/profile';

interface ProfileBadgesProps {
    badges: UserBadge[];
    showAll?: boolean;
}

export function ProfileBadges({ badges, showAll = false }: ProfileBadgesProps) {
    if (badges.length === 0 && showAll) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">🎖️</div>
                <h3 className="text-xl font-bold text-starlight-white mb-2">No Badges Yet</h3>
                <p className="text-steel-grey max-w-md mx-auto">
                    Win cases, maintain streaks, and provide strong evidence to earn badges!
                </p>
            </div>
        );
    }

    return (
        <div className={showAll ? 'space-y-8' : ''}>
            {showAll && (
                <div className="mb-6">
                    <p className="text-steel-grey">
                        You&apos;ve earned <span className="text-electric-violet font-bold">{badges.length}</span> badge{badges.length !== 1 ? 's' : ''}.
                        Keep arguing to unlock more!
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>

            {showAll && (
                <div className="mt-12">
                    <h3 className="text-lg font-bold text-starlight-white mb-4 flex items-center gap-2">
                        <span>🔒</span> Badges to Unlock
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 opacity-50">
                        {Object.entries(BADGE_DEFINITIONS)
                            .filter(([id]) => !badges.some(b => b.badge_id === id))
                            .slice(0, 6)
                            .map(([id, def]) => (
                                <LockedBadgeCard key={id} definition={def} />
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function BadgeCard({ badge }: { badge: UserBadge }) {
    const tierColor = TIER_COLORS[badge.badge_tier];

    return (
        <div
            className="relative p-4 rounded-2xl border transition-all hover:scale-105"
            style={{
                backgroundColor: tierColor.bg,
                borderColor: tierColor.border
            }}
        >
            {/* Tier indicator */}
            <div
                className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{ color: tierColor.text, backgroundColor: tierColor.bg }}
            >
                {badge.badge_tier}
            </div>

            {/* Badge content */}
            <div className="text-4xl mb-3">{badge.badge_icon}</div>
            <div className="text-starlight-white font-bold text-sm mb-1">{badge.badge_name}</div>
            <div className="text-steel-grey text-xs">{badge.badge_description}</div>

            {/* Earned date */}
            <div className="text-steel-grey/50 text-[10px] mt-3">
                Earned {new Date(badge.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
        </div>
    );
}

function LockedBadgeCard({ definition }: { definition: typeof BADGE_DEFINITIONS[keyof typeof BADGE_DEFINITIONS] }) {
    return (
        <div className="relative p-4 rounded-2xl border border-white/5 bg-charcoal-layer/30">
            {/* Lock icon */}
            <div className="absolute top-2 right-2 text-steel-grey text-xs">🔒</div>

            {/* Badge content (faded) */}
            <div className="text-4xl mb-3 grayscale">{definition.icon}</div>
            <div className="text-steel-grey font-bold text-sm mb-1">{definition.name}</div>
            <div className="text-steel-grey/50 text-xs">{definition.description}</div>
        </div>
    );
}