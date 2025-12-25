import type { DisputeCategory, VerdictTone } from './index';

// ============================================
// USER STATS TYPES
// ============================================

export interface CategoryStat {
    wins: number;
    losses: number;
    draws: number;
    total: number;
}

export interface CategoryStats {
    relationship: CategoryStat;
    roommate: CategoryStat;
    sports: CategoryStat;
    tech: CategoryStat;
    general: CategoryStat;
}

export interface UserStats {
    id: string;
    user_id: string;

    // Overall stats
    total_cases: number;
    total_wins: number;
    total_losses: number;
    total_draws: number;
    win_rate: number;

    // Streaks
    current_streak: number;
    longest_streak: number;
    // Added these as a part of detailed streak tracking
    longest_win_streak: number;
    longest_loss_streak: number;
    streak_type: 'win' | 'loss' | 'none';

    // Category breakdown
    category_stats: CategoryStats;

    // Performance metrics
    avg_score: number;
    total_fallacies_detected: number;
    common_strengths: string[];
    common_weaknesses: string[];

    // Evidence stats
    cases_with_evidence: number;
    evidence_win_rate: number;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    badge_name: string;
    badge_description: string;
    badge_icon: string;
    badge_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    earned_at: string;
}

export interface CaseHistoryEntry {
    id: string;
    user_id: string;
    case_id: string;
    case_code: string;
    role: 'party_a' | 'party_b';
    opponent_name: string;
    outcome: 'win' | 'loss' | 'draw';
    score: number;
    opponent_score: number;
    category: DisputeCategory;
    tone: VerdictTone;
    had_evidence: boolean;
    fallacies_count: number;
    created_at: string;
}

export interface UserProfile {
    stats: UserStats | null;
    badges: UserBadge[];
    recent_cases: CaseHistoryEntry[];
}

export interface LeaderboardEntry {
    user_id: string;
    display_name?: string;
    total_wins: number;
    total_cases: number;
    win_rate: number;
    longest_streak: number;
    avg_score: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface GetProfileResponse {
    success: boolean;
    profile?: UserProfile;
    error?: string;
}

export interface GetLeaderboardResponse {
    success: boolean;
    leaderboard?: LeaderboardEntry[];
    error?: string;
}

// ============================================
// BADGE DEFINITIONS
// ============================================

export const BADGE_DEFINITIONS = {
    first_case: {
        id: 'first_case',
        name: 'First Timer',
        description: 'Settled your first dispute',
        icon: '🎯',
        tiers: ['bronze']
    },
    streak_3: {
        id: 'streak_3',
        name: 'On Fire',
        description: '3 wins in a row',
        icon: '🔥',
        tiers: ['bronze']
    },
    streak_5: {
        id: 'streak_5',
        name: 'Unstoppable',
        description: '5 wins in a row',
        icon: '🔥',
        tiers: ['silver']
    },
    streak_10: {
        id: 'streak_10',
        name: 'Legendary',
        description: '10 wins in a row',
        icon: '🔥',
        tiers: ['gold']
    },
    wins_5: {
        id: 'wins_5',
        name: 'Winner',
        description: '5 total wins',
        icon: '🏆',
        tiers: ['bronze']
    },
    wins_25: {
        id: 'wins_25',
        name: 'Champion',
        description: '25 total wins',
        icon: '🏆',
        tiers: ['silver']
    },
    wins_100: {
        id: 'wins_100',
        name: 'Grand Champion',
        description: '100 total wins',
        icon: '🏆',
        tiers: ['gold']
    },
    evidence_expert: {
        id: 'evidence_expert',
        name: 'Evidence Expert',
        description: 'Win 70%+ of cases with evidence',
        icon: '📎',
        tiers: ['bronze']
    },
    evidence_master: {
        id: 'evidence_master',
        name: 'Evidence Master',
        description: 'Win 80%+ of cases with evidence (20+ cases)',
        icon: '📎',
        tiers: ['gold']
    },
    high_scorer: {
        id: 'high_scorer',
        name: 'Strong Arguments',
        description: 'Average score 75+ (5+ cases)',
        icon: '💪',
        tiers: ['bronze']
    },
    master_debater: {
        id: 'master_debater',
        name: 'Master Debater',
        description: 'Average score 85+ (10+ cases)',
        icon: '💪',
        tiers: ['gold']
    },
    compromise_champion: {
        id: 'compromise_champion',
        name: 'Compromise Champion',
        description: 'Reached 3 draws - sometimes both are right!',
        icon: '🤝',
        tiers: ['bronze']
    },
    relationship_guru: {
        id: 'relationship_guru',
        name: 'Relationship Guru',
        description: '10 wins in relationship disputes',
        icon: '💕',
        tiers: ['silver']
    },
    tech_titan: {
        id: 'tech_titan',
        name: 'Tech Titan',
        description: '10 wins in tech disputes',
        icon: '💻',
        tiers: ['silver']
    },
    veteran: {
        id: 'veteran',
        name: 'Veteran Arguer',
        description: '50 total cases settled',
        icon: '⭐',
        tiers: ['gold']
    },
    clean_fighter: {
        id: 'clean_fighter',
        name: 'Clean Fighter',
        description: 'Less than 1 fallacy per case average',
        icon: '✨',
        tiers: ['silver']
    }
} as const;

export const TIER_COLORS = {
    bronze: {
        bg: 'rgba(205, 127, 50, 0.2)',
        border: 'rgba(205, 127, 50, 0.4)',
        text: '#CD7F32'
    },
    silver: {
        bg: 'rgba(192, 192, 192, 0.2)',
        border: 'rgba(192, 192, 192, 0.4)',
        text: '#C0C0C0'
    },
    gold: {
        bg: 'rgba(255, 215, 0, 0.2)',
        border: 'rgba(255, 215, 0, 0.4)',
        text: '#FFD700'
    },
    platinum: {
        bg: 'rgba(229, 228, 226, 0.2)',
        border: 'rgba(229, 228, 226, 0.4)',
        text: '#E5E4E2'
    }
} as const;