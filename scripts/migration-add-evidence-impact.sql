-- Adding evidence_impact column for storing how image/OCR evidence influenced the verdict
ALTER TABLE verdicts 
ADD COLUMN IF NOT EXISTS evidence_impact TEXT;

-- Adding comment for documentation
COMMENT ON COLUMN verdicts.evidence_impact IS 'Explains how submitted image evidence (screenshots, receipts, etc.) influenced the verdict';