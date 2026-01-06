import { HONEYPOT_FIELD_NAMES } from '@/types';
import type { HoneypotData, HoneypotValidationResult } from '@/types';

// Minimum time (ms) a human would take to fill a form
// Forms with multiple fields + evidence uploads should take at least 20 minutes
const MIN_FORM_TIME_MS = 20 * 60 * 1000;

// Maximum reasonable time (30 minutes) - forms older than this are suspicious
const MAX_FORM_TIME_MS = 30 * 60 * 1000;



export function encodeTimestamp(timestamp: number): string {
    const key = 0x5F3759DF; // arbitrary constant
    const obfuscated = timestamp ^ key;
    return Buffer.from(obfuscated.toString()).toString('base64');
}



export function decodeTimestamp(encoded: string): number | null {
    try {
        const key = 0x5F3759DF;
        const decoded = Buffer.from(encoded, 'base64').toString();
        const timestamp = parseInt(decoded, 10) ^ key;

        if (isNaN(timestamp) || timestamp < 0 || timestamp > Date.now() + 1000) {
            return null;
        }

        return timestamp;
    } catch {
        return null;
    }
}



/**
 * Validates honeypot data from a form submission
 * @param honeypotData - The honeypot fields from the request
 * @returns Validation result with bot detection status
 */

export function validateHoneypot(honeypotData: HoneypotData): HoneypotValidationResult {

    const filledHoneypots: string[] = [];



    // Check invisible fields - any content means bot

    const websiteValue = honeypotData[HONEYPOT_FIELD_NAMES.website];

    const emailValue = honeypotData[HONEYPOT_FIELD_NAMES.email];

    const phoneValue = honeypotData[HONEYPOT_FIELD_NAMES.phone];



    if (websiteValue && websiteValue.trim().length > 0) {

        filledHoneypots.push('website');

    }

    if (emailValue && emailValue.trim().length > 0) {

        filledHoneypots.push('email');

    }

    if (phoneValue && phoneValue.trim().length > 0) {

        filledHoneypots.push('phone');

    }



    // Check timing

    const encodedTimestamp = honeypotData[HONEYPOT_FIELD_NAMES.timestamp];

    let timingMs: number | null = null;

    let timingValid = true;



    if (encodedTimestamp) {

        const formLoadTime = decodeTimestamp(encodedTimestamp);

        if (formLoadTime !== null) {

            timingMs = Date.now() - formLoadTime;



            // Too fast = bot, too slow = suspicious (but not conclusive)

            if (timingMs < MIN_FORM_TIME_MS) {

                timingValid = false;

            } else if (timingMs > MAX_FORM_TIME_MS) {

                // Form is very old - could be legitimate (user left tab open)

                // but still flag it as suspicious timing

                timingValid = false;

            }

        } else {

            // Couldn't decode timestamp - tampered with or invalid

            timingValid = false;

        }

    } else {

        // No timestamp at all - missing honeypot data

        timingValid = false;

    }



    // Determine if this is a bot

    const honeypotTriggered = filledHoneypots.length > 0;

    const timingTriggered = !timingValid && timingMs !== null && timingMs < MIN_FORM_TIME_MS;



    const isBot = honeypotTriggered || timingTriggered;



    let reason: string | undefined;

    if (honeypotTriggered) {

        reason = `honeypot_fields_filled: ${filledHoneypots.join(', ')}`;

    } else if (timingTriggered) {

        reason = `form_submitted_too_fast: ${timingMs}ms`;

    }



    return {

        isBot,

        reason,

        details: {

            filledHoneypots,

            timingMs,

            timingValid,

        },

    };

}



/**

 * Logs bot detection for monitoring/analytics

 */

export function logBotDetection(

    clientIp: string,

    endpoint: string,

    result: HoneypotValidationResult

): void {

    if (result.isBot) {

        console.warn(

            `[HONEYPOT] Bot detected - IP: ${clientIp}, Endpoint: ${endpoint}, Reason: ${result.reason}, Details: ${JSON.stringify(result.details)}`

        );

    }

}



/**

 * Creates a fake success response that mimics real responses

 * This prevents bots from knowing they've been detected

 */

export function createFakeSuccessResponse(type: 'case' | 'response'): object {

    if (type === 'case') {

        // Fake case creation response

        const fakeCode = `WR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        return {

            success: true,

            code: fakeCode,

            share_url: `https://rightitup.vercel.app/case/${fakeCode}`,

        };

    } else {

        // Fake response submission

        const fakeCode = `WR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        return {

            success: true,

            status: 'complete',

            verdict_url: `/verdict/${fakeCode}`,

        };

    }

}



/**

 * Extracts honeypot data from a request body

 * Works with any request body shape

 */

export function extractHoneypotData(body: Record<string, unknown>): HoneypotData {

    return {

        [HONEYPOT_FIELD_NAMES.website]: body[HONEYPOT_FIELD_NAMES.website] as string | undefined,

        [HONEYPOT_FIELD_NAMES.email]: body[HONEYPOT_FIELD_NAMES.email] as string | undefined,

        [HONEYPOT_FIELD_NAMES.phone]: body[HONEYPOT_FIELD_NAMES.phone] as string | undefined,

        [HONEYPOT_FIELD_NAMES.timestamp]: body[HONEYPOT_FIELD_NAMES.timestamp] as string | undefined,

    };

}