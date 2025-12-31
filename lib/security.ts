import DOMPurify from 'isomorphic-dompurify';

const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

// Escape HTML special characters to prevent XSS
export function escapeHtml(str: string): string {
    return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

// Strip all HTML tags from a string
export function stripHtml(str: string): string {
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags and content
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags and content
        .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
        .replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
}

// Sanitize user input for safe storage and display
// Use this for user-provided text that will be stored in the database
export function sanitizeInput(input: string, maxLength: number = 5000): string {
    if (typeof input !== 'string') return '';
    
    input = input
        .trim()
        .slice(0, maxLength)
        // Remove null bytes and other control characters (except newlines and tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize whitespace (multiple spaces to single, preserve newlines)
        .replace(/[^\S\n]+/g, ' ')
        
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// Sanitize input and also strip HTML tags
// Use this for text that should be plain text only
export function sanitizeTextOnly(input: string, maxLength: number = 5000): string {
    return stripHtml(sanitizeInput(input, maxLength));
}

// Sanitize AI-generated output before displaying to users
// More permissive than input sanitization but still removes dangerous content
export function sanitizeAIOutput(output: string): string {
    if (typeof output !== 'string') return '';

    return output
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove style tags and content
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Remove iframe tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove event handlers
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
        // Remove javascript: and data: URLs
        .replace(/href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '')
        .replace(/src\s*=\s*["']?\s*data:[^"'>\s]*/gi, '')
        // Remove null bytes
        .replace(/\x00/g, '');
}

// Validate and sanitize a case code
export function sanitizeCaseCode(code: string): string | null {
    if (typeof code !== 'string') return null;

    const sanitized = code.trim().toUpperCase();

    // Case code format: WR-YYYY-XXXX
    if (!/^WR-\d{4}-\d{4}$/.test(sanitized)) {
        return null;
    }

    return sanitized;
}

// Validate and sanitize a name/handle
export function sanitizeName(name: string, maxLength: number = 100): string {
    if (typeof name !== 'string') return '';

    return name
        .trim()
        .slice(0, maxLength)
        // Allow alphanumeric, spaces, underscores, hyphens, and @ for handles
        .replace(/[^\w\s@\-\.]/g, '')
        // Collapse multiple spaces
        .replace(/\s+/g, ' ');
}

// Validate email format
export function isValidEmail(email: string): boolean {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Sanitize a URL (for evidence images)
export function sanitizeUrl(url: string): string | null {
    if (typeof url !== 'string') return null;

    try {
        const parsed = new URL(url.trim());

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        // Return the sanitized URL
        return parsed.href;
    } catch {
        return null;
    }
}

// Sanitize an array of URLs
export function sanitizeUrls(urls: string[]): string[] {
    if (!Array.isArray(urls)) return [];

    return urls
        .map(sanitizeUrl)
        .filter((url): url is string => url !== null);
}

// Sanitize evidence text array
export function sanitizeEvidenceText(evidence: string[]): string[] {
    if (!Array.isArray(evidence)) return [];

    return evidence
        .map((text) => sanitizeTextOnly(text, 1000))
        .filter((text) => text.length > 0);
}

// Check if a string might contain prompt injection attempts
// Returns true if suspicious patterns are detected
export function detectPromptInjection(text: string): boolean {
    if (typeof text !== 'string') return false;

    const suspiciousPatterns = [
        /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
        /disregard\s+(all\s+)?(previous|above|prior)/i,
        /you\s+are\s+(now|no\s+longer)/i,
        /new\s+instructions?:/i,
        /system\s*:\s*/i,
        /\[INST\]/i,
        /<<SYS>>/i,
        /\{\{.*\}\}/,
        /<\|.*\|>/,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(text));
}

// Create a safe excerpt from text for logging
// Truncates and removes sensitive patterns
export function safeLogExcerpt(text: string, maxLength: number = 100): string {
    if (typeof text !== 'string') return '[non-string]';

    return text
        .slice(0, maxLength)
        .replace(/[\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() + (text.length > maxLength ? '...' : '');
}