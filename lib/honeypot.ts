/**
 * Honeypot Security Module
 *
 * Implements invisible honeypot fields and timing analysis to catch bots.
 * Returns fake success responses to bots to avoid revealing detection.
 */

// Honeypot field names disguised as legitimate form fields
// Bots will try to fill these, humans won't see them
export const HONEYPOT_FIELDS = {
    // Looks like a website/URL field - bots love these
    website: '_hp_website',
    // Looks like a secondary email field
    confirmEmail: '_hp_confirm_email',
    // Looks like a phone field
    phone: '_hp_phone_number',
} as const;

// Timing thresholds (in milliseconds)
export const TIMING_CONFIG = {
    // Minimum time to fill a form (3 seconds) - bots submit instantly
    MIN_SUBMISSION_TIME: 3000,
    // Maximum time before form is considered stale (30 minutes)
    MAX_SUBMISSION_TIME: 30 * 60 * 1000,
    // Time field name (encoded to look like a form metadata field)
    TIMESTAMP_FIELD: '_hp_form_token',
} as const;

/**
 * Honeypot validation result
 */
export interface HoneypotValidationResult {
    isBot: boolean;
    reason?: 'honeypot_filled' | 'too_fast' | 'too_slow' | 'invalid_timestamp' | 'missing_fields';
    details?: string;
}

/**
 * Honeypot data sent from client forms
 */
export interface HoneypotData {
    [HONEYPOT_FIELDS.website]?: string;
    [HONEYPOT_FIELDS.confirmEmail]?: string;
    [HONEYPOT_FIELDS.phone]?: string;
    [TIMING_CONFIG.TIMESTAMP_FIELD]?: string;
}

/**
 * Encode timestamp to obscure it from bots
 * Uses base64 with a simple offset to make it less obvious
 */
export function encodeTimestamp(timestamp: number): string {
    const offset = 1609459200000; // Jan 1, 2021 - arbitrary offset
    const encoded = (timestamp - offset).toString(36);
    return Buffer.from(encoded).toString('base64');
}

/**
 * Decode timestamp from form submission
 */
export function decodeTimestamp(encoded: string): number | null {
    try {
        const offset = 1609459200000;
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        const timestamp = parseInt(decoded, 36) + offset;

        // Sanity check - timestamp should be within reasonable range
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

        if (timestamp > oneYearAgo && timestamp <= now) {
            return timestamp;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Validate honeypot fields on the server
 * Returns whether the submission appears to be from a bot
 */
export function validateHoneypot(data: HoneypotData): HoneypotValidationResult {
    // Check if honeypot fields are filled (bots will fill these)
    const honeypotValues = [
        data[HONEYPOT_FIELDS.website],
        data[HONEYPOT_FIELDS.confirmEmail],
        data[HONEYPOT_FIELDS.phone],
    ];

    for (const value of honeypotValues) {
        if (value && value.trim().length > 0) {
            return {
                isBot: true,
                reason: 'honeypot_filled',
                details: 'Hidden field was filled'
            };
        }
    }

    // Check timing
    const timestampToken = data[TIMING_CONFIG.TIMESTAMP_FIELD];

    if (!timestampToken) {
        return {
            isBot: true,
            reason: 'missing_fields',
            details: 'Form token missing'
        };
    }

    const formLoadTime = decodeTimestamp(timestampToken);

    if (!formLoadTime) {
        return {
            isBot: true,
            reason: 'invalid_timestamp',
            details: 'Invalid form token'
        };
    }

    const submissionTime = Date.now();
    const timeSpent = submissionTime - formLoadTime;

    // Too fast - likely a bot
    if (timeSpent < TIMING_CONFIG.MIN_SUBMISSION_TIME) {
        return {
            isBot: true,
            reason: 'too_fast',
            details: `Form submitted in ${timeSpent}ms (minimum: ${TIMING_CONFIG.MIN_SUBMISSION_TIME}ms)`
        };
    }

    // Too slow - form might be stale or replay attack
    if (timeSpent > TIMING_CONFIG.MAX_SUBMISSION_TIME) {
        return {
            isBot: true,
            reason: 'too_slow',
            details: 'Form session expired'
        };
    }

    // Passed all checks
    return { isBot: false };
}

/**
 * Generate a fake success response for bots
 * This prevents bots from knowing they were detected
 */
export function generateFakeSuccessResponse(type: 'case' | 'response'): object {
    if (type === 'case') {
        // Fake case creation response
        const fakeCode = `WR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        return {
            success: true,
            code: fakeCode,
            share_url: `https://rightitup.vercel.app/case/${fakeCode}`
        };
    } else {
        // Fake response submission
        return {
            success: true,
            status: 'complete',
            verdict_url: `/verdict/WR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        };
    }
}

/**
 * Log bot detection for monitoring (without revealing to the bot)
 */
export function logBotDetection(
    clientIp: string,
    result: HoneypotValidationResult,
    endpoint: string
): void {
    console.warn(
        `[Honeypot] Bot detected at ${endpoint}`,
        {
            ip: clientIp,
            reason: result.reason,
            details: result.details,
            timestamp: new Date().toISOString()
        }
    );
}

/**
 * Extract honeypot data from request body
 * Removes honeypot fields from the body so they don't pollute actual data
 */
export function extractHoneypotData<T extends Record<string, unknown>>(
    body: T
): { honeypotData: HoneypotData; cleanBody: Omit<T, keyof HoneypotData> } {
    const honeypotData: HoneypotData = {
        [HONEYPOT_FIELDS.website]: body[HONEYPOT_FIELDS.website] as string | undefined,
        [HONEYPOT_FIELDS.confirmEmail]: body[HONEYPOT_FIELDS.confirmEmail] as string | undefined,
        [HONEYPOT_FIELDS.phone]: body[HONEYPOT_FIELDS.phone] as string | undefined,
        [TIMING_CONFIG.TIMESTAMP_FIELD]: body[TIMING_CONFIG.TIMESTAMP_FIELD] as string | undefined,
    };

    // Create clean body without honeypot fields
    const cleanBody = { ...body };
    delete cleanBody[HONEYPOT_FIELDS.website];
    delete cleanBody[HONEYPOT_FIELDS.confirmEmail];
    delete cleanBody[HONEYPOT_FIELDS.phone];
    delete cleanBody[TIMING_CONFIG.TIMESTAMP_FIELD];

    return { honeypotData, cleanBody: cleanBody as Omit<T, keyof HoneypotData> };
}
