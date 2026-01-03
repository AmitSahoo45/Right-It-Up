'use client';

import { HONEYPOT_FIELDS, HONEYPOT_STYLES } from '@/lib/honeypot';

interface HoneypotFieldsProps {
    values: {
        [HONEYPOT_FIELDS.TEXT]: string;
        [HONEYPOT_FIELDS.EMAIL]: string;
        [HONEYPOT_FIELDS.TIMESTAMP]: string;
    };
    onChange: (field: string, value: string) => void;
}

export function HoneypotFields({ values, onChange }: HoneypotFieldsProps) {
    return (
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
            }}
        >

            <label htmlFor={HONEYPOT_FIELDS.TEXT}>Website URL</label>
            <input
                type="text"
                id={HONEYPOT_FIELDS.TEXT}
                name={HONEYPOT_FIELDS.TEXT}
                value={values[HONEYPOT_FIELDS.TEXT]}
                onChange={(e) => onChange(HONEYPOT_FIELDS.TEXT, e.target.value)}
                tabIndex={-1}
                autoComplete="off"
            />
            

            <label htmlFor={HONEYPOT_FIELDS.EMAIL}>Contact Email</label>
            <input
                type="email"
                id={HONEYPOT_FIELDS.EMAIL}
                name={HONEYPOT_FIELDS.EMAIL}
                value={values[HONEYPOT_FIELDS.EMAIL]}
                onChange={(e) => onChange(HONEYPOT_FIELDS.EMAIL, e.target.value)}
                tabIndex={-1}
                autoComplete="off"
            />
            

            <input
                type="hidden"
                name={HONEYPOT_FIELDS.TIMESTAMP}
                value={values[HONEYPOT_FIELDS.TIMESTAMP]}
            />
        </div>
    );
}