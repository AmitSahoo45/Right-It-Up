'use client';

import { useState, useEffect, useCallback } from 'react';
import { encodeTimestamp } from '@/lib/honeypot/honeypot';
import { HONEYPOT_FIELD_NAMES } from '@/types';

export function useHoneypot() {
    const [formLoadTimestamp, setFormLoadTimestamp] = useState<string>('');
    const [honeypotValues, setHoneypotValues] = useState({
        website: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        setFormLoadTimestamp(encodeTimestamp(Date.now()));
    }, []);

    const handleHoneypotChange = useCallback(
        (field: 'website' | 'email' | 'phone') =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                setHoneypotValues((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                }));
            },
        []
    );

    const getHoneypotData = useCallback(() => {
        return {
            [HONEYPOT_FIELD_NAMES.website]: honeypotValues.website,
            [HONEYPOT_FIELD_NAMES.email]: honeypotValues.email,
            [HONEYPOT_FIELD_NAMES.phone]: honeypotValues.phone,
            [HONEYPOT_FIELD_NAMES.timestamp]: formLoadTimestamp,
        };
    }, [honeypotValues, formLoadTimestamp]);

    const HoneypotFields = useCallback(
        () => (
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    height: 0,
                    width: 0,
                    overflow: 'hidden',
                    opacity: 0,
                    pointerEvents: 'none',
                }}
            >
                <label htmlFor="website_url">Website</label>
                <input
                    type="text"
                    id="website_url"
                    name={HONEYPOT_FIELD_NAMES.website}
                    value={honeypotValues.website}
                    onChange={handleHoneypotChange('website')}
                    tabIndex={-1}
                    autoComplete="off"
                    placeholder="https://yourwebsite.com"
                />

                <label htmlFor="contact_email">Email Address</label>
                <input
                    type="email"
                    id="contact_email"
                    name={HONEYPOT_FIELD_NAMES.email}
                    value={honeypotValues.email}
                    onChange={handleHoneypotChange('email')}
                    tabIndex={-1}
                    autoComplete="off"
                    placeholder="your@email.com"
                />

                <label htmlFor="phone_number">Phone Number</label>
                <input
                    type="tel"
                    id="phone_number"
                    name={HONEYPOT_FIELD_NAMES.phone}
                    value={honeypotValues.phone}
                    onChange={handleHoneypotChange('phone')}
                    tabIndex={-1}
                    autoComplete="off"
                    placeholder="+1 (555) 000-0000"
                />

                <input
                    type="hidden"
                    name={HONEYPOT_FIELD_NAMES.timestamp}
                    value={formLoadTimestamp}
                />
            </div>
        ),
        [honeypotValues, formLoadTimestamp, handleHoneypotChange]
    );

    return {
        HoneypotFields,
        getHoneypotData,
        honeypotValues,
        formLoadTimestamp,
    };
}

export default useHoneypot;