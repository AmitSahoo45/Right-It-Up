-- ============================================
-- USER STATS & BADGES TABLES
-- Migration for Win/Loss Tracking + Profiles
-- ============================================

-- User statistics table - tracks overall and per-category performance
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Overall stats
    total_cases INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_losses INT DEFAULT 0,
    total_draws INT DEFAULT 0,
    
    -- Win rate (computed, stored for performance)
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Current streak
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    streak_type VARCHAR(10) DEFAULT 'none', -- 'win', 'loss', 'none'
    
    -- Category-specific stats (JSONB for flexibility)
    -- Structure: { "relationship": {wins: 0, losses: 0, draws: 0}, ... }
    category_stats JSONB DEFAULT '{
        "relationship": {"wins": 0, "losses": 0, "draws": 0, "total": 0},
        "roommate": {"wins": 0, "losses": 0, "draws": 0, "total": 0},
        "sports": {"wins": 0, "losses": 0, "draws": 0, "total": 0},
        "tech": {"wins": 0, "losses": 0, "draws": 0, "total": 0},
        "general": {"wins": 0, "losses": 0, "draws": 0, "total": 0}
    }'::jsonb,
    
    -- Argument quality insights (aggregated from verdicts)
    avg_score DECIMAL(5,2) DEFAULT 0,
    total_fallacies_detected INT DEFAULT 0,
    common_strengths JSONB DEFAULT '[]'::jsonb,
    common_weaknesses JSONB DEFAULT '[]'::jsonb,
    
    -- Evidence usage stats
    cases_with_evidence INT DEFAULT 0,
    evidence_win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(10),
    badge_tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate badges (same badge can have multiple tiers)
    UNIQUE(user_id, badge_id, badge_tier)
);

-- Case participation record (for history)
CREATE TABLE IF NOT EXISTS user_case_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    case_code VARCHAR(20) NOT NULL,
    
    -- Role in the case
    role VARCHAR(10) NOT NULL CHECK (role IN ('party_a', 'party_b')),
    
    -- Opponent info (for display)
    opponent_name VARCHAR(100),
    
    -- Outcome
    outcome VARCHAR(10) NOT NULL CHECK (outcome IN ('win', 'loss', 'draw')),
    score INT,
    opponent_score INT,
    
    -- Category and metadata
    category VARCHAR(20),
    tone VARCHAR(20),
    
    -- Evidence used
    had_evidence BOOLEAN DEFAULT FALSE,
    
    -- Fallacies detected in user's argument
    fallacies_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries
    UNIQUE(user_id, case_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_win_rate ON user_stats(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_case_history_user ON user_case_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_case_history_created ON user_case_history(user_id, created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Initialize user stats (called when user first participates)
CREATE OR REPLACE FUNCTION initialize_user_stats(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user stats after a verdict
CREATE OR REPLACE FUNCTION update_user_stats_after_verdict(
    p_user_id UUID,
    p_case_id UUID,
    p_case_code VARCHAR,
    p_role VARCHAR, -- 'party_a' or 'party_b'
    p_outcome VARCHAR, -- 'win', 'loss', 'draw'
    p_score INT,
    p_opponent_score INT,
    p_opponent_name VARCHAR,
    p_category VARCHAR,
    p_tone VARCHAR,
    p_had_evidence BOOLEAN,
    p_fallacies_count INT
)
RETURNS VOID AS $$
DECLARE
    v_current_stats user_stats%ROWTYPE;
    v_new_streak INT;
    v_new_streak_type VARCHAR(10);
    v_category_stats JSONB;
    v_wins_with_evidence INT;
    v_total_with_evidence INT;
BEGIN
    -- Ensure user stats exist
    PERFORM initialize_user_stats(p_user_id);
    
    -- Get current stats
    SELECT * INTO v_current_stats FROM user_stats WHERE user_id = p_user_id;
    
    -- Calculate new streak
    IF p_outcome = 'win' THEN
        IF v_current_stats.streak_type = 'win' THEN
            v_new_streak := v_current_stats.current_streak + 1;
        ELSE
            v_new_streak := 1;
        END IF;
        v_new_streak_type := 'win';
    ELSIF p_outcome = 'loss' THEN
        IF v_current_stats.streak_type = 'loss' THEN
            v_new_streak := v_current_stats.current_streak + 1;
        ELSE
            v_new_streak := 1;
        END IF;
        v_new_streak_type := 'loss';
    ELSE
        v_new_streak := 0;
        v_new_streak_type := 'none';
    END IF;
    
    -- Update category stats
    v_category_stats := v_current_stats.category_stats;
    v_category_stats := jsonb_set(
        v_category_stats,
        ARRAY[p_category, 'total'],
        to_jsonb(COALESCE((v_category_stats -> p_category ->> 'total')::int, 0) + 1)
    );
    
    IF p_outcome = 'win' THEN
        v_category_stats := jsonb_set(
            v_category_stats,
            ARRAY[p_category, 'wins'],
            to_jsonb(COALESCE((v_category_stats -> p_category ->> 'wins')::int, 0) + 1)
        );
    ELSIF p_outcome = 'loss' THEN
        v_category_stats := jsonb_set(
            v_category_stats,
            ARRAY[p_category, 'losses'],
            to_jsonb(COALESCE((v_category_stats -> p_category ->> 'losses')::int, 0) + 1)
        );
    ELSE
        v_category_stats := jsonb_set(
            v_category_stats,
            ARRAY[p_category, 'draws'],
            to_jsonb(COALESCE((v_category_stats -> p_category ->> 'draws')::int, 0) + 1)
        );
    END IF;
    
    -- Calculate evidence win rate
    SELECT 
        COUNT(*) FILTER (WHERE outcome = 'win' AND had_evidence),
        COUNT(*) FILTER (WHERE had_evidence)
    INTO v_wins_with_evidence, v_total_with_evidence
    FROM user_case_history
    WHERE user_id = p_user_id;
    
    -- Add current case to counts
    IF p_had_evidence THEN
        v_total_with_evidence := v_total_with_evidence + 1;
        IF p_outcome = 'win' THEN
            v_wins_with_evidence := v_wins_with_evidence + 1;
        END IF;
    END IF;
    
    -- Update user_stats
    UPDATE user_stats SET
        total_cases = total_cases + 1,
        total_wins = total_wins + CASE WHEN p_outcome = 'win' THEN 1 ELSE 0 END,
        total_losses = total_losses + CASE WHEN p_outcome = 'loss' THEN 1 ELSE 0 END,
        total_draws = total_draws + CASE WHEN p_outcome = 'draw' THEN 1 ELSE 0 END,
        win_rate = CASE 
            WHEN (total_cases + 1) > 0 
            THEN ROUND(((total_wins + CASE WHEN p_outcome = 'win' THEN 1 ELSE 0 END)::decimal / (total_cases + 1)) * 100, 2)
            ELSE 0 
        END,
        current_streak = v_new_streak,
        longest_streak = GREATEST(v_current_stats.longest_streak, v_new_streak),
        streak_type = v_new_streak_type,
        category_stats = v_category_stats,
        avg_score = ROUND(((avg_score * total_cases) + p_score) / (total_cases + 1), 2),
        total_fallacies_detected = total_fallacies_detected + p_fallacies_count,
        cases_with_evidence = cases_with_evidence + CASE WHEN p_had_evidence THEN 1 ELSE 0 END,
        evidence_win_rate = CASE 
            WHEN v_total_with_evidence > 0 
            THEN ROUND((v_wins_with_evidence::decimal / v_total_with_evidence) * 100, 2)
            ELSE 0 
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Add to case history
    INSERT INTO user_case_history (
        user_id, case_id, case_code, role, opponent_name, 
        outcome, score, opponent_score, category, tone, 
        had_evidence, fallacies_count
    ) VALUES (
        p_user_id, p_case_id, p_case_code, p_role, p_opponent_name,
        p_outcome, p_score, p_opponent_score, p_category, p_tone,
        p_had_evidence, p_fallacies_count
    ) ON CONFLICT (user_id, case_id) DO NOTHING;
    
    -- Check and award badges
    PERFORM check_and_award_badges(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_stats user_stats%ROWTYPE;
BEGIN
    SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
    
    -- First Case badge
    IF v_stats.total_cases >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'first_case', 'First Timer', 'Settled your first dispute', '🎯', 'bronze')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Win Streak badges
    IF v_stats.longest_streak >= 3 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'streak_3', 'On Fire', '3 wins in a row', '🔥', 'bronze')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_stats.longest_streak >= 5 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'streak_5', 'Unstoppable', '5 wins in a row', '🔥', 'silver')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_stats.longest_streak >= 10 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'streak_10', 'Legendary', '10 wins in a row', '🔥', 'gold')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Total wins badges
    IF v_stats.total_wins >= 5 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'wins_5', 'Winner', '5 total wins', '🏆', 'bronze')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_stats.total_wins >= 25 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'wins_25', 'Champion', '25 total wins', '🏆', 'silver')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_stats.total_wins >= 100 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'wins_100', 'Grand Champion', '100 total wins', '🏆', 'gold')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Evidence Expert badges
    IF v_stats.cases_with_evidence >= 5 AND v_stats.evidence_win_rate >= 70 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'evidence_expert', 'Evidence Expert', 'Win 70%+ of cases with evidence', '📎', 'bronze')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_stats.cases_with_evidence >= 20 AND v_stats.evidence_win_rate >= 80 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'evidence_master', 'Evidence Master', 'Win 80%+ of cases with evidence (20+ cases)', '📎', 'gold')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- High score badges
    IF v_stats.avg_score >= 75 AND v_stats.total_cases >= 5 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'high_scorer', 'Strong Arguments', 'Average score 75+ (5+ cases)', '💪', 'bronze')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_stats.avg_score >= 85 AND v_stats.total_cases >= 10 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'master_debater', 'Master Debater', 'Average score 85+ (10+ cases)', '💪', 'gold')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Compromise Champion (draws)
    IF v_stats.total_draws >= 3 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'compromise_champion', 'Compromise Champion', 'Reached 3 draws - sometimes both are right!', '🤝', 'bronze')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Category specialist badges
    IF (v_stats.category_stats -> 'relationship' ->> 'wins')::int >= 10 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'relationship_guru', 'Relationship Guru', '10 wins in relationship disputes', '💕', 'silver')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF (v_stats.category_stats -> 'tech' ->> 'wins')::int >= 10 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'tech_titan', 'Tech Titan', '10 wins in tech disputes', '💻', 'silver')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Veteran badge
    IF v_stats.total_cases >= 50 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'veteran', 'Veteran Arguer', '50 total cases settled', '⭐', 'gold')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Clean Fighter (low fallacies)
    IF v_stats.total_cases >= 10 AND (v_stats.total_fallacies_detected::decimal / v_stats.total_cases) < 1 THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_tier)
        VALUES (p_user_id, 'clean_fighter', 'Clean Fighter', 'Less than 1 fallacy per case average', '✨', 'silver')
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user profile with stats
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE(
    stats JSONB,
    badges JSONB,
    recent_cases JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT to_jsonb(us.*) FROM user_stats us WHERE us.user_id = p_user_id) as stats,
        (SELECT COALESCE(jsonb_agg(to_jsonb(ub.*) ORDER BY ub.earned_at DESC), '[]'::jsonb) 
         FROM user_badges ub WHERE ub.user_id = p_user_id) as badges,
        (SELECT COALESCE(jsonb_agg(to_jsonb(uch.*) ORDER BY uch.created_at DESC), '[]'::jsonb) 
         FROM (SELECT * FROM user_case_history WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 20) uch) as recent_cases;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INT DEFAULT 10)
RETURNS TABLE(
    user_id UUID,
    total_wins INT,
    total_cases INT,
    win_rate DECIMAL,
    longest_streak INT,
    avg_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.user_id,
        us.total_wins,
        us.total_cases,
        us.win_rate,
        us.longest_streak,
        us.avg_score
    FROM user_stats us
    WHERE us.total_cases >= 3 -- Minimum cases for leaderboard
    ORDER BY us.win_rate DESC, us.total_wins DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own stats
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

-- System can update stats
CREATE POLICY "System can manage stats" ON user_stats
    FOR ALL USING (true);

-- Users can view their own badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert badges
CREATE POLICY "System can insert badges" ON user_badges
    FOR INSERT WITH CHECK (true);

-- Users can view their own history
CREATE POLICY "Users can view own history" ON user_case_history
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert history
CREATE POLICY "System can insert history" ON user_case_history
    FOR INSERT WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_stats IS 'Stores aggregated win/loss statistics for each user';
COMMENT ON TABLE user_badges IS 'Earned badges and achievements for users';
COMMENT ON TABLE user_case_history IS 'Historical record of all cases a user participated in';
COMMENT ON FUNCTION update_user_stats_after_verdict IS 'Called after verdict to update user stats and check for badges';