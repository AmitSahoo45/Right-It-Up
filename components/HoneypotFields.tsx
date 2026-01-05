'use client';

import { useEffect, useState } from 'react';
import { HONEYPOT_FIELDS, TIMING_CONFIG } from '@/lib/honeypot';

/**
 * Encode timestamp on the client side
 * Must match the server-side encoding
 */
function encodeTimestamp(timestamp: number): string {
    const offset = 1609459200000; // Jan 1, 2021 - must match server
    const encoded = (timestamp - offset).toString(36);
    // Use btoa for browser-side base64 encoding
    return btoa(encoded);
}

export interface HoneypotValues {
    [key: string]: string;
}

interface HoneypotFieldsProps {
    /**
     * Callback to update parent form with honeypot values
     * Called on mount with the timestamp token
     */
    onValuesChange: (values: HoneypotValues) => void;
}

/**
 * HoneypotFields Component
 *
 * Renders invisible form fields that trap bots.
 * - Bots will see and fill these fields (they parse the DOM)
 * - Humans won't see them (hidden via CSS)
 * - Also tracks timing for submission speed analysis
 *
 * Usage:
 * 1. Include this component inside your form
 * 2. Pass the honeypot values when submitting the form
 */
export function HoneypotFields({ onValuesChange }: HoneypotFieldsProps) {
    const [honeypotValues, setHoneypotValues] = useState<HoneypotValues>({
        [HONEYPOT_FIELDS.website]: '',
        [HONEYPOT_FIELDS.confirmEmail]: '',
        [HONEYPOT_FIELDS.phone]: '',
        [TIMING_CONFIG.TIMESTAMP_FIELD]: '',
    });

    // Set timestamp on mount (when form loads)
    useEffect(() => {
        const token = encodeTimestamp(Date.now());
        const initialValues = {
            [HONEYPOT_FIELDS.website]: '',
            [HONEYPOT_FIELDS.confirmEmail]: '',
            [HONEYPOT_FIELDS.phone]: '',
            [TIMING_CONFIG.TIMESTAMP_FIELD]: token,
        };
        setHoneypotValues(initialValues);
        onValuesChange(initialValues);
    }, [onValuesChange]);

    // Update parent when honeypot fields change (only bots would do this)
    const handleChange = (field: string, value: string) => {
        const newValues = { ...honeypotValues, [field]: value };
        setHoneypotValues(newValues);
        onValuesChange(newValues);
    };

    return (
        <>
            {/*
                These fields are invisible to humans but visible to bots.
                Multiple hiding techniques are used to ensure accessibility tools
                also skip these fields:
                - position: absolute with negative positioning
                - opacity: 0
                - height/width: 0
                - tabIndex: -1 (skip in tab order)
                - aria-hidden: true
                - autocomplete: off (prevent browser autofill)
            */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    opacity: 0,
                    pointerEvents: 'none',
                }}
            >
                {/* Website field - bots love filling URL fields */}
                <label htmlFor={HONEYPOT_FIELDS.website}>
                    Website URL
                    <input
                        type="url"
                        id={HONEYPOT_FIELDS.website}
                        name={HONEYPOT_FIELDS.website}
                        value={honeypotValues[HONEYPOT_FIELDS.website]}
                        onChange={(e) => handleChange(HONEYPOT_FIELDS.website, e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </label>

                {/* Confirm email - common form field bots try to fill */}
                <label htmlFor={HONEYPOT_FIELDS.confirmEmail}>
                    Confirm Email
                    <input
                        type="email"
                        id={HONEYPOT_FIELDS.confirmEmail}
                        name={HONEYPOT_FIELDS.confirmEmail}
                        value={honeypotValues[HONEYPOT_FIELDS.confirmEmail]}
                        onChange={(e) => handleChange(HONEYPOT_FIELDS.confirmEmail, e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </label>

                {/* Phone number - another common target */}
                <label htmlFor={HONEYPOT_FIELDS.phone}>
                    Phone Number
                    <input
                        type="tel"
                        id={HONEYPOT_FIELDS.phone}
                        name={HONEYPOT_FIELDS.phone}
                        value={honeypotValues[HONEYPOT_FIELDS.phone]}
                        onChange={(e) => handleChange(HONEYPOT_FIELDS.phone, e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </label>

                {/* Hidden timestamp token */}
                <input
                    type="hidden"
                    name={TIMING_CONFIG.TIMESTAMP_FIELD}
                    value={honeypotValues[TIMING_CONFIG.TIMESTAMP_FIELD]}
                />
            </div>
        </>
    );
}

/**
 * Hook for managing honeypot state
 * Alternative to the component if you need more control
 */
export function useHoneypot() {
    const [honeypotValues, setHoneypotValues] = useState<HoneypotValues>({
        [HONEYPOT_FIELDS.website]: '',
        [HONEYPOT_FIELDS.confirmEmail]: '',
        [HONEYPOT_FIELDS.phone]: '',
        [TIMING_CONFIG.TIMESTAMP_FIELD]: '',
    });

    useEffect(() => {
        const token = encodeTimestamp(Date.now());
        setHoneypotValues(prev => ({
            ...prev,
            [TIMING_CONFIG.TIMESTAMP_FIELD]: token,
        }));
    }, []);

    const updateHoneypotValues = (values: HoneypotValues) => {
        setHoneypotValues(values);
    };

    return { honeypotValues, updateHoneypotValues };
}
