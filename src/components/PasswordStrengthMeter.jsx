import { useMemo } from 'react';

function evaluate(password) {
    if (!password) return { score: 0, label: '', color: 'transparent' };

    let s = 0;
    if (password.length >= 6)  s++;  // basic length
    if (password.length >= 12) s++;  // good length
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;  // mixed case
    if (/\d/.test(password)) s++;    // digits
    if (/[^a-zA-Z0-9]/.test(password)) s++;  // special characters
    s = Math.min(s, 5);

    const levels = [
        null,
        { label: 'VERY WEAK',   color: '#F85149' },
        { label: 'WEAK',        color: '#E07A1F' },
        { label: 'FAIR',        color: '#D29922' },
        { label: 'STRONG',      color: '#3FB950' },
        { label: 'VERY STRONG', color: '#26A641' },
    ];

    return { score: s, ...(levels[s] || { label: '', color: 'transparent' }) };
}

export default function PasswordStrengthMeter({ password }) {
    const { score, label, color } = useMemo(() => evaluate(password), [password]);

    if (!password) return null;

    return (
        <div style={{ marginTop: '0.5rem' }}>
            {/* 5-segment bar */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '0.4rem' }}>
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} style={{
                        flex: 1,
                        height: '3px',
                        borderRadius: '2px',
                        background: i < score ? color : 'var(--border-default)',
                        transition: 'background 0.3s ease',
                    }} />
                ))}
            </div>
            {/* Label */}
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                color,
                transition: 'color 0.3s ease',
            }}>
                {label}
            </span>
        </div>
    );
}
