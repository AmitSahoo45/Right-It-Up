'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileBadges } from '@/components/profile/ProfileBadges';
import { ProfileHistory } from '@/components/profile/ProfileHistory';
import { ProfileCategoryBreakdown } from '@/components/profile/ProfileCategoryBreakdown';
import type { UserProfile } from '@/types/profile';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'badges'>('overview');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/profile');
            return;
        }

        if (user) {
            fetchProfile();
        }
    }, [user, authLoading, router]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();

            if (data.success) {
                setProfile(data.profile);

                console.log("Profile data: \n ================================================== \n", data.profile);
            } else {
                setError(data.error || 'Failed to load profile');
            }
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-10 pb-20">
                <div className="max-w-4xl mx-auto">
                    <ProfileSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-10 pb-20">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-6xl mb-6">😕</div>
                    <h1 className="text-3xl font-black text-starlight-white mb-4">Oops!</h1>
                    <p className="text-steel-grey mb-8">{error}</p>
                    <button
                        onClick={fetchProfile}
                        className="px-6 py-3 bg-electric-violet text-white font-bold rounded-xl"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const hasStats = profile?.stats && profile.stats.total_cases > 0;

    return (
        <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-10 pb-20">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-electric-violet/20 via-cyber-blue/10 to-transparent border border-white/10 rounded-3xl p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-electric-violet to-cyber-blue flex items-center justify-center text-4xl font-bold text-white shadow-electric-glow">
                            {userName.charAt(0).toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-black text-starlight-white mb-2">
                                {userName}
                            </h1>
                            <p className="text-steel-grey mb-4">
                                {hasStats
                                    ? `Arguing since ${new Date(profile.stats!.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                                    : 'New to the courtroom'}
                            </p>

                            {/* Quick Stats */}
                            {hasStats && (
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <QuickStat
                                        label="Win Rate"
                                        value={`${profile.stats!.win_rate}%`}
                                        color={profile.stats!.win_rate >= 50 ? 'green' : 'amber'}
                                    />
                                    <QuickStat
                                        label="Cases"
                                        value={profile.stats!.total_cases}
                                        color="blue"
                                    />
                                    <QuickStat
                                        label="Streak"
                                        value={profile.stats!.current_streak}
                                        suffix={profile.stats!.streak_type === 'win' ? '🔥' : ''}
                                        color={profile.stats!.streak_type === 'win' ? 'green' : 'grey'}
                                    />
                                    <QuickStat
                                        label="Badges"
                                        value={profile.badges?.length || 0}
                                        color="violet"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    <TabButton
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        icon="📊"
                        label="Overview"
                    />
                    <TabButton
                        active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                        icon="📜"
                        label="History"
                    />
                    <TabButton
                        active={activeTab === 'badges'}
                        onClick={() => setActiveTab('badges')}
                        icon="🏆"
                        label="Badges"
                    />
                </div>

                {/* Content */}
                {!hasStats ? (
                    <EmptyState />
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <ProfileStats stats={profile.stats!} />
                                <ProfileCategoryBreakdown stats={profile.stats!} />
                                {profile.badges.length > 0 && (
                                    <div>
                                        <h2 className="text-xl font-bold text-starlight-white mb-4 flex items-center gap-2">
                                            <span>🏆</span> Recent Badges
                                        </h2>
                                        <ProfileBadges badges={profile.badges.slice(0, 6)} />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <ProfileHistory history={profile.recent_cases} />
                        )}

                        {activeTab === 'badges' && (
                            <ProfileBadges badges={profile.badges} showAll />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Quick stat component
function QuickStat({
    label,
    value,
    suffix = '',
    color
}: {
    label: string;
    value: string | number;
    suffix?: string;
    color: 'green' | 'amber' | 'blue' | 'violet' | 'grey';
}) {
    const colors = {
        green: 'text-verdict-green',
        amber: 'text-caution-amber',
        blue: 'text-cyber-blue',
        violet: 'text-electric-violet',
        grey: 'text-steel-grey'
    };

    return (
        <div className="text-center px-4 py-2 bg-charcoal-layer/50 rounded-xl border border-white/5">
            <div className={`text-xl font-black ${colors[color]}`}>
                {value}{suffix}
            </div>
            <div className="text-steel-grey text-xs">{label}</div>
        </div>
    );
}

// Tab button component
function TabButton({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${active
                    ? 'bg-electric-violet/20 text-electric-violet border border-electric-violet/30'
                    : 'bg-charcoal-layer/30 text-steel-grey border border-white/5 hover:border-white/20'
                }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

// Empty state component
function EmptyState() {
    return (
        <div className="text-center py-16">
            <div className="text-7xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold text-starlight-white mb-4">
                No Cases Yet
            </h2>
            <p className="text-steel-grey mb-8 max-w-md mx-auto">
                Start settling arguments to build your profile! Your wins, losses, and badges will appear here.
            </p>
            <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold rounded-xl hover:shadow-electric-glow transition-all"
            >
                ⚖️ Start Your First Case
            </Link>
        </div>
    );
}

// Loading skeleton
function ProfileSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="bg-charcoal-layer/50 rounded-3xl p-8 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-charcoal-layer"></div>
                    <div className="flex-1">
                        <div className="h-8 bg-charcoal-layer rounded-lg w-48 mb-3"></div>
                        <div className="h-4 bg-charcoal-layer rounded w-32 mb-4"></div>
                        <div className="flex gap-4">
                            <div className="h-12 bg-charcoal-layer rounded-xl w-20"></div>
                            <div className="h-12 bg-charcoal-layer rounded-xl w-20"></div>
                            <div className="h-12 bg-charcoal-layer rounded-xl w-20"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-12 bg-charcoal-layer rounded-xl w-64 mb-8"></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-charcoal-layer rounded-2xl"></div>
                <div className="h-32 bg-charcoal-layer rounded-2xl"></div>
                <div className="h-32 bg-charcoal-layer rounded-2xl"></div>
                <div className="h-32 bg-charcoal-layer rounded-2xl"></div>
            </div>
        </div>
    );
}