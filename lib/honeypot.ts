export const HONEYPOT_FIELDS = {
    TEXT: 'website_url',
    EMAIL: 'contact_email',
    TIMESTAMP: 'form_token',
} as const;

const MIN_SUBMISSION_TIME = 30000; // 30 seconds

const MAX_SUBMISSION_TIME = 60 * 60 * 1000; // 1 hour

export interface HoneypotFields {
    [HONEYPOT_FIELDS.TEXT]?: string;
    [HONEYPOT_FIELDS.EMAIL]?: string;
    [HONEYPOT_FIELDS.TIMESTAMP]?: string;
}

export interface HoneypotValidationResult {
    isBot: boolean;
    reason?: string;
    confidence: 'low' | 'medium' | 'high';
}


export function validateHoneypot(fields: HoneypotFields): HoneypotValidationResult {
    const textField = fields[HONEYPOT_FIELDS.TEXT];
    if (textField && textField.trim() !== '') {
        return {
            isBot: true,
            reason: 'Text honeypot field was filled',
            confidence: 'high',
        };
    }
    
    const emailField = fields[HONEYPOT_FIELDS.EMAIL];
    if (emailField && emailField.trim() !== '') {
        return {
            isBot: true,
            reason: 'Email honeypot field was filled',
            confidence: 'high',
        };
    }
    
    const timestamp = fields[HONEYPOT_FIELDS.TIMESTAMP];
    if (timestamp) {
        const timestampResult = validateTimestamp(timestamp);
        if (timestampResult.isBot) {
            return timestampResult;
        }
    }
    
    return {
        isBot: false,
        confidence: 'low',
    };
}

function validateTimestamp(encodedTimestamp: string): HoneypotValidationResult {
    try {
        const decodedTimestamp = decodeTimestamp(encodedTimestamp);
        if (!decodedTimestamp) {
            return {
                isBot: true,
                reason: 'Invalid timestamp format',
                confidence: 'medium',
            };
        }
        
        const now = Date.now();
        const elapsed = now - decodedTimestamp;
        
        // Too fast = likely a bot
        if (elapsed < MIN_SUBMISSION_TIME) {
            return {
                isBot: true,
                reason: `Form submitted too quickly (${elapsed}ms)`,
                confidence: 'high',
            };
        }
        
        if (elapsed > MAX_SUBMISSION_TIME) {
            return {
                isBot: true,
                reason: 'Form token expired',
                confidence: 'medium',
            };
        }
        
        return { isBot: false, confidence: 'low' };
    } catch (error) {
        return {
            isBot: true,
            reason: 'Timestamp validation failed',
            confidence: 'medium',
        };
    }
}

export function generateFormToken(): string {
    const timestamp = Date.now();
    const noise = Math.random().toString(36).substring(2, 8);
    
    // Simple obfuscation - encode timestamp with noise
    const payload = `${timestamp}:${noise}`;
    return Buffer.from(payload).toString('base64');
}

function decodeTimestamp(encoded: string): number | null {
    try {
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        const [timestampStr] = decoded.split(':');
        const timestamp = parseInt(timestampStr, 10);
        
        if (isNaN(timestamp)) return null;
        return timestamp;
    } catch {
        return null;
    }
}

export const HONEYPOT_STYLES = {
    position: 'absolute' as const,
    left: '-9999px',
    top: '-9999px',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    opacity: 0,
    tabIndex: -1,
    pointerEvents: 'none' as const,
    ariaHidden: true,
};


export function getHoneypotFieldProps(fieldName: keyof typeof HONEYPOT_FIELDS) {
    return {
        name: HONEYPOT_FIELDS[fieldName],
        autoComplete: 'off',
        tabIndex: -1,
        'aria-hidden': true,
        style: HONEYPOT_STYLES,
    };
}


export function validateRequestHoneypot(body: Record<string, unknown>): HoneypotValidationResult {
    const honeypotFields: HoneypotFields = {
        [HONEYPOT_FIELDS.TEXT]: body[HONEYPOT_FIELDS.TEXT] as string | undefined,
        [HONEYPOT_FIELDS.EMAIL]: body[HONEYPOT_FIELDS.EMAIL] as string | undefined,
        [HONEYPOT_FIELDS.TIMESTAMP]: body[HONEYPOT_FIELDS.TIMESTAMP] as string | undefined,
    };
    
    return validateHoneypot(honeypotFields);
}

export function removeHoneypotFields<T extends Record<string, unknown>>(body: T): Omit<T, 'website_url' | 'contact_email' | 'form_token'> {
    const cleaned = { ...body };
    delete cleaned[HONEYPOT_FIELDS.TEXT];
    delete cleaned[HONEYPOT_FIELDS.EMAIL];
    delete cleaned[HONEYPOT_FIELDS.TIMESTAMP];
    return cleaned as Omit<T, 'website_url' | 'contact_email' | 'form_token'>;
}