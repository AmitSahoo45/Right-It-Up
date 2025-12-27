-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    
    -- Who filed the appeal
    appealing_party VARCHAR(10) NOT NULL CHECK (appealing_party IN ('partyA', 'partyB')),
    appellant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Appeal content
    reason TEXT NOT NULL,
    new_evidence_text TEXT,
    new_evidence_images TEXT[] DEFAULT '{}',
    
    -- Original verdict snapshot (for comparison)
    original_verdict JSONB NOT NULL,
    original_winner VARCHAR(10) NOT NULL,
    original_party_a_score INT NOT NULL,
    original_party_b_score INT NOT NULL,
    
    -- Appeal verdict (filled after processing)
    appeal_verdict JSONB,
    new_winner VARCHAR(10),
    new_party_a_score INT,
    new_party_b_score INT,
    verdict_changed BOOLEAN DEFAULT FALSE,
    change_summary TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Ensure one appeal per party per case
    UNIQUE(case_id, appealing_party)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_appeals_case_id ON appeals(case_id);
CREATE INDEX IF NOT EXISTS idx_appeals_appellant_id ON appeals(appellant_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);

-- Update cases table to track appeal status
ALTER TABLE cases ADD COLUMN IF NOT EXISTS party_a_appealed BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS party_b_appealed BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS appeal_count INT DEFAULT 0;

-- Function to check if party can appeal
CREATE OR REPLACE FUNCTION can_party_appeal(
    p_case_id UUID,
    p_party VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_case_status VARCHAR(20);
    v_already_appealed BOOLEAN;
BEGIN
    -- Check case exists and is complete
    SELECT status INTO v_case_status
    FROM cases
    WHERE id = p_case_id;
    
    IF v_case_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF v_case_status != 'complete' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if party already appealed
    SELECT EXISTS(
        SELECT 1 FROM appeals
        WHERE case_id = p_case_id
        AND appealing_party = p_party
    ) INTO v_already_appealed;
    
    RETURN NOT v_already_appealed;
END;
$$ LANGUAGE plpgsql;

-- Function to submit appeal
CREATE OR REPLACE FUNCTION submit_appeal(
    p_case_id UUID,
    p_appealing_party VARCHAR(10),
    p_appellant_id UUID,
    p_reason TEXT,
    p_new_evidence_text TEXT DEFAULT NULL,
    p_new_evidence_images TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_appeal_id UUID;
    v_original_verdict JSONB;
    v_original_winner VARCHAR(10);
    v_original_party_a_score INT;
    v_original_party_b_score INT;
BEGIN
    -- Verify party can appeal
    IF NOT can_party_appeal(p_case_id, p_appealing_party) THEN
        RAISE EXCEPTION 'Party cannot appeal this case';
    END IF;
    
    -- Get original verdict data
    SELECT 
        jsonb_build_object(
            'winner', winner,
            'confidence', confidence,
            'summary', summary,
            'reasoning', reasoning,
            'advice', advice,
            'party_a_analysis', party_a_analysis,
            'party_b_analysis', party_b_analysis
        ),
        winner,
        party_a_score,
        party_b_score
    INTO 
        v_original_verdict,
        v_original_winner,
        v_original_party_a_score,
        v_original_party_b_score
    FROM verdicts
    WHERE case_id = p_case_id;
    
    IF v_original_verdict IS NULL THEN
        RAISE EXCEPTION 'No verdict found for this case';
    END IF;
    
    -- Insert appeal
    INSERT INTO appeals (
        case_id,
        appealing_party,
        appellant_id,
        reason,
        new_evidence_text,
        new_evidence_images,
        original_verdict,
        original_winner,
        original_party_a_score,
        original_party_b_score,
        status
    ) VALUES (
        p_case_id,
        p_appealing_party,
        p_appellant_id,
        p_reason,
        p_new_evidence_text,
        p_new_evidence_images,
        v_original_verdict,
        v_original_winner,
        v_original_party_a_score,
        v_original_party_b_score,
        'pending'
    ) RETURNING id INTO v_appeal_id;
    
    -- Update case appeal tracking
    UPDATE cases
    SET 
        appeal_count = appeal_count + 1,
        party_a_appealed = CASE WHEN p_appealing_party = 'partyA' THEN TRUE ELSE party_a_appealed END,
        party_b_appealed = CASE WHEN p_appealing_party = 'partyB' THEN TRUE ELSE party_b_appealed END
    WHERE id = p_case_id;
    
    RETURN v_appeal_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete appeal processing
CREATE OR REPLACE FUNCTION complete_appeal(
    p_appeal_id UUID,
    p_appeal_verdict JSONB,
    p_new_winner VARCHAR(10),
    p_new_party_a_score INT,
    p_new_party_b_score INT,
    p_change_summary TEXT
)
RETURNS VOID AS $$
DECLARE
    v_original_winner VARCHAR(10);
    v_verdict_changed BOOLEAN;
BEGIN
    -- Get original winner
    SELECT original_winner INTO v_original_winner
    FROM appeals
    WHERE id = p_appeal_id;
    
    -- Determine if verdict changed
    v_verdict_changed := (v_original_winner != p_new_winner);
    
    -- Update appeal record
    UPDATE appeals
    SET 
        appeal_verdict = p_appeal_verdict,
        new_winner = p_new_winner,
        new_party_a_score = p_new_party_a_score,
        new_party_b_score = p_new_party_b_score,
        verdict_changed = v_verdict_changed,
        change_summary = p_change_summary,
        status = 'completed',
        processed_at = NOW()
    WHERE id = p_appeal_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- Anyone can view appeals for cases they're involved in
CREATE POLICY "Users can view appeals for their cases"
ON appeals FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM cases c
        WHERE c.id = appeals.case_id
        AND (c.party_a_id = auth.uid() OR c.party_b_id = auth.uid())
    )
);

-- Users can insert appeals for cases they're party to
CREATE POLICY "Users can submit appeals for their cases"
ON appeals FOR INSERT
WITH CHECK (
    appellant_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM cases c
        WHERE c.id = case_id
        AND (
            (appealing_party = 'partyA' AND c.party_a_id = auth.uid())
            OR (appealing_party = 'partyB' AND c.party_b_id = auth.uid())
        )
    )
);

-- Service role can update appeals (for processing)
CREATE POLICY "Service role can update appeals"
ON appeals FOR UPDATE
USING (true)
WITH CHECK (true);

COMMENT ON TABLE appeals IS 'Stores appeal requests for completed cases. Each party gets one appeal per case.';