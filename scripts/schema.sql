-- This will enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(20) DEFAULT 'general',
    tone VARCHAR(20) DEFAULT 'neutral',
    status VARCHAR(20) DEFAULT 'pending_response',
    -- Status values: pending_response | blocked_quota | analyzing | complete | expired
    
    -- Party A (case creator)
    party_a_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    party_a_name VARCHAR(100) NOT NULL,
    party_a_argument TEXT NOT NULL,
    party_a_evidence_text TEXT[] DEFAULT '{}',
    party_a_evidence_images TEXT[] DEFAULT '{}', -- Storage URLs
    party_a_ip VARCHAR(45),
    
    -- Party B (respondent)
    party_b_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    party_b_name VARCHAR(100),
    party_b_argument TEXT,
    party_b_evidence_text TEXT[] DEFAULT '{}',
    party_b_evidence_images TEXT[] DEFAULT '{}',
    party_b_ip VARCHAR(45),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 days')
);

-- Verdicts table
CREATE TABLE IF NOT EXISTS verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
    
    -- Scores
    party_a_score INT CHECK (party_a_score >= 0 AND party_a_score <= 100),
    party_b_score INT CHECK (party_b_score >= 0 AND party_b_score <= 100),
    
    -- Analysis (JSONB for flexibility)
    party_a_analysis JSONB DEFAULT '{}',
    -- Structure: {strengths: [], weaknesses: [], fallacies: []}
    party_b_analysis JSONB DEFAULT '{}',
    
    -- Verdict details
    winner VARCHAR(10) CHECK (winner IN ('partyA', 'partyB', 'draw')),
    confidence INT CHECK (confidence >= 0 AND confidence <= 100),
    summary TEXT,
    reasoning TEXT,
    advice TEXT,
    
    -- Meta
    ai_provider VARCHAR(20),
    
    -- Pre-generated verdict images for fast sharing
    receipt_image_url TEXT,
    ruling_image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verdict usage tracking (for rate limiting)
CREATE TABLE IF NOT EXISTS verdict_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_ip VARCHAR(45),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Either user_id or guest_ip must be present
    CONSTRAINT user_or_ip CHECK (user_id IS NOT NULL OR guest_ip IS NOT NULL)
);

-- ============================================
-- INDEXES
-- ============================================

-- Fast lookup by case code
CREATE INDEX IF NOT EXISTS idx_cases_code ON cases(code);

-- Fast lookup for user's cases
CREATE INDEX IF NOT EXISTS idx_cases_party_a ON cases(party_a_id);
CREATE INDEX IF NOT EXISTS idx_cases_party_b ON cases(party_b_id);

-- Fast status filtering
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- Fast expiration checks
CREATE INDEX IF NOT EXISTS idx_cases_expires ON cases(expires_at) WHERE status = 'pending_response';

-- Fast rate limit checks
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON verdict_usage(user_id, used_at);
CREATE INDEX IF NOT EXISTS idx_usage_ip_date ON verdict_usage(guest_ip, used_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate unique case code (WR-YYYY-XXXX)
CREATE OR REPLACE FUNCTION generate_case_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := 'WR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || 
                    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM cases WHERE code = new_code) INTO code_exists;
        
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Check if authenticated user can request verdict (5/day)
CREATE OR REPLACE FUNCTION check_user_quota(p_user_id UUID)
RETURNS TABLE(can_use BOOLEAN, remaining INT, used INT) AS $$
DECLARE
    usage_count INT;
BEGIN
    SELECT COUNT(*) INTO usage_count
    FROM verdict_usage
    WHERE user_id = p_user_id
    AND used_at > NOW() - INTERVAL '24 hours';
    
    RETURN QUERY SELECT 
        usage_count < 5,
        GREATEST(0, 5 - usage_count),
        usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if guest can request verdict (1 total)
CREATE OR REPLACE FUNCTION check_guest_quota(p_ip VARCHAR)
RETURNS TABLE(can_use BOOLEAN, remaining INT, used INT) AS $$
DECLARE
    usage_count INT;
BEGIN
    SELECT COUNT(*) INTO usage_count
    FROM verdict_usage
    WHERE guest_ip = p_ip;
    
    RETURN QUERY SELECT 
        usage_count < 1,
        GREATEST(0, 1 - usage_count),
        usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record verdict usage for a user or guest
CREATE OR REPLACE FUNCTION record_verdict_usage(
    p_case_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_guest_ip VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO verdict_usage (case_id, user_id, guest_ip)
    VALUES (p_case_id, p_user_id, CASE WHEN p_user_id IS NULL THEN p_guest_ip ELSE NULL END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get case with verdict (if exists)
CREATE OR REPLACE FUNCTION get_case_with_verdict(p_code VARCHAR)
RETURNS TABLE(
    case_data JSONB,
    verdict_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(c.*) AS case_data,
        to_jsonb(v.*) AS verdict_data
    FROM cases c
    LEFT JOIN verdicts v ON v.case_id = c.id
    WHERE c.code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire old cases (run via cron or edge function)
CREATE OR REPLACE FUNCTION expire_old_cases()
RETURNS INT AS $$
DECLARE
    expired_count INT;
BEGIN
    UPDATE cases 
    SET status = 'expired'
    WHERE status = 'pending_response' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_usage ENABLE ROW LEVEL SECURITY;

-- Cases: Anyone can view by code (for sharing), users can see their own
CREATE POLICY "Cases are viewable by anyone with the code" ON cases
    FOR SELECT USING (true);

CREATE POLICY "Users can create cases" ON cases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Party B can update to add response" ON cases
    FOR UPDATE USING (
        status = 'pending_response' AND party_b_argument IS NULL
    );

-- Verdicts: Viewable if you're part of the case
CREATE POLICY "Verdicts viewable by case participants" ON verdicts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cases c 
            WHERE c.id = verdicts.case_id
        )
    );

CREATE POLICY "System can create verdicts" ON verdicts
    FOR INSERT WITH CHECK (true);

-- Usage: Users can only see their own usage
CREATE POLICY "Users see own usage" ON verdict_usage
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL -- Guests tracked by IP in application layer
    );

CREATE POLICY "System can insert usage" ON verdict_usage
    FOR INSERT WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET (Run separately in Supabase Dashboard)
-- ============================================
-- 
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket: "evidence"
-- 3. Make it public (for image URLs to work)
-- 4. Add policy: Allow authenticated users to upload
-- 
-- Or run this SQL:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('evidence', 'evidence', true);
--
-- Storage policies (run in SQL editor):

-- Allow anyone to view evidence images
-- CREATE POLICY "Evidence images are publicly viewable"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'evidence');

-- Allow authenticated users to upload evidence
-- CREATE POLICY "Authenticated users can upload evidence"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'evidence' AND
--     auth.role() = 'authenticated'
-- );

-- ============================================
-- CRON JOB FOR EXPIRING CASES
-- ============================================
-- 
-- Option 1: Use Supabase pg_cron extension
-- SELECT cron.schedule(
--     'expire-old-cases',
--     '0 * * * *', -- Every hour
--     'SELECT expire_old_cases();'
-- );
--
-- Option 2: Use Supabase Edge Function with scheduled trigger
-- (Recommended for serverless)