import { createClient } from '@/utils/supabase/server';
import type { UserProfile, LeaderboardEntry, UserStats, UserBadge, CaseHistoryEntry } from '@/types/profile';

/**
 * Get user profile with stats, badges, and recent cases
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_user_profile', {
        p_user_id: userId
    });
    
    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    
    if (!data || data.length === 0) {
        return { stats: null, badges: [], recent_cases: [] };
    }
    
    const row = data[0];
    return {
        stats: row.stats,
        badges: row.badges || [],
        recent_cases: row.recent_cases || []
    };
}

/**
 * Get basic user stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching user stats:', error);
        return null;
    }
    
    return data;
}

/**
 * Get user badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching user badges:', error);
        return [];
    }
    
    return data || [];
}

/**
 * Get user case history
 */
export async function getUserCaseHistory(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
): Promise<CaseHistoryEntry[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('user_case_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    
    if (error) {
        console.error('Error fetching case history:', error);
        return [];
    }
    
    return data || [];
}

/**
 * Update user stats after a verdict
 */
export async function updateUserStatsAfterVerdict(params: {
    userId: string;
    caseId: string;
    caseCode: string;
    role: 'party_a' | 'party_b';
    outcome: 'win' | 'loss' | 'draw';
    score: number;
    opponentScore: number;
    opponentName: string;
    category: string;
    tone: string;
    hadEvidence: boolean;
    fallaciesCount: number;
}): Promise<boolean> {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('update_user_stats_after_verdict', {
        p_user_id: params.userId,
        p_case_id: params.caseId,
        p_case_code: params.caseCode,
        p_role: params.role,
        p_outcome: params.outcome,
        p_score: params.score,
        p_opponent_score: params.opponentScore,
        p_opponent_name: params.opponentName,
        p_category: params.category,
        p_tone: params.tone,
        p_had_evidence: params.hadEvidence,
        p_fallacies_count: params.fallaciesCount
    });
    
    if (error) {
        console.error('Error updating user stats:', error);
        return false;
    }
    
    return true;
}

/**
 * Initialize user stats if they don't exist
 */
export async function initializeUserStats(userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('initialize_user_stats', {
        p_user_id: userId
    });
    
    if (error) {
        console.error('Error initializing user stats:', error);
        return false;
    }
    
    return true;
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_leaderboard', {
        p_limit: limit
    });
    
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
    
    return data || [];
}

/**
 * Helper to determine outcome for a party based on verdict
 */
export function determineOutcome(
    winner: 'partyA' | 'partyB' | 'draw',
    partyRole: 'party_a' | 'party_b'
): 'win' | 'loss' | 'draw' {
    if (winner === 'draw') return 'draw';
    
    const isPartyA = partyRole === 'party_a';
    const partyAWon = winner === 'partyA';
    
    if (isPartyA && partyAWon) return 'win';
    if (!isPartyA && !partyAWon) return 'win';
    return 'loss';
}

/**
 * Update stats for both parties after a verdict
 */
export async function updateBothPartiesStats(params: {
    caseId: string;
    caseCode: string;
    category: string;
    tone: string;
    winner: 'partyA' | 'partyB' | 'draw';
    
    partyAUserId: string | null;
    partyAName: string;
    partyAScore: number;
    partyAHadEvidence: boolean;
    partyAFallacies: number;
    
    partyBUserId: string | null;
    partyBName: string;
    partyBScore: number;
    partyBHadEvidence: boolean;
    partyBFallacies: number;
}): Promise<void> {
    // Update Party A stats if they're a registered user
    if (params.partyAUserId) {
        await updateUserStatsAfterVerdict({
            userId: params.partyAUserId,
            caseId: params.caseId,
            caseCode: params.caseCode,
            role: 'party_a',
            outcome: determineOutcome(params.winner, 'party_a'),
            score: params.partyAScore,
            opponentScore: params.partyBScore,
            opponentName: params.partyBName,
            category: params.category,
            tone: params.tone,
            hadEvidence: params.partyAHadEvidence,
            fallaciesCount: params.partyAFallacies
        });
    }
    
    // Update Party B stats if they're a registered user
    if (params.partyBUserId) {
        await updateUserStatsAfterVerdict({
            userId: params.partyBUserId,
            caseId: params.caseId,
            caseCode: params.caseCode,
            role: 'party_b',
            outcome: determineOutcome(params.winner, 'party_b'),
            score: params.partyBScore,
            opponentScore: params.partyAScore,
            opponentName: params.partyAName,
            category: params.category,
            tone: params.tone,
            hadEvidence: params.partyBHadEvidence,
            fallaciesCount: params.partyBFallacies
        });
    }
}