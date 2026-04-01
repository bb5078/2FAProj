/**
 * DashboardPage — protected authenticated landing page.
 * Wrapped in <PrivateRoute> in App.jsx.
 * Shows user info, active 2FA method, and a research panel to switch methods.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, LogOut, User, Mail, Smartphone,
    KeyRound, Lock, CheckCircle, RefreshCw, FlaskConical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setMfaMethod } from '../utils/api';

export default function DashboardPage() {
    const { user, doLogout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [switching, setSwitching] = useState(null);
    const [phoneInput, setPhoneInput] = useState('');
    const [switchError, setSwitchError] = useState('');
    const [switchSuccess, setSwitchSuccess] = useState('');

    const mfaMethod = user?.totp_enabled ? 'totp' : user?.phone ? 'sms' : 'email';
    const MFAIcon = mfaMethod === 'totp' ? KeyRound : mfaMethod === 'sms' ? Smartphone : Mail;
    const mfaLabel = mfaMethod === 'totp' ? 'TOTP Authenticator (RFC 6238)'
        : mfaMethod === 'sms' ? 'SMS OTP'
        : 'Email OTP';

    const handleLogout = async () => {
        await doLogout();
        navigate('/login', { replace: true });
    };

    const handleSwitchMethod = async (method) => {
        setSwitchError('');
        setSwitchSuccess('');

        if (method === 'totp') {
            setSwitching('totp');
            try {
                await setMfaMethod('totp');
                navigate('/mfa-setup');
            } catch {
                setSwitchError('Failed to initiate TOTP setup.');
            } finally {
                setSwitching(null);
            }
            return;
        }

        if (method === 'sms' && !phoneInput.trim()) {
            setSwitchError('Enter your phone number above first (e.g. +447911123456).');
            return;
        }

        setSwitching(method);
        try {
            const result = await setMfaMethod(method, method === 'sms' ? phoneInput.trim() : null);
            if (result.success) {
                setSwitchSuccess(`Switched to ${method.toUpperCase()}. Sign out and log back in to test it.`);
                setPhoneInput('');
                await refreshUser();
            } else {
                setSwitchError(result.message || 'Switch failed.');
            }
        } catch {
            setSwitchError('Network error. Please try again.');
        } finally {
            setSwitching(null);
        }
    };

    const methodButtons = [
        {
            id: 'email',
            label: 'Email OTP',
            desc: 'Code sent to your email via Brevo REST API',
            Icon: Mail,
            color: '#4DA6FF',
        },
        {
            id: 'sms',
            label: 'SMS OTP',
            desc: 'Code sent to your phone via Twilio',
            Icon: Smartphone,
            color: '#A78BFA',
        },
        {
            id: 'totp',
            label: 'TOTP (Authenticator)',
            desc: 'RFC 6238 — Google Authenticator / Authy',
            Icon: KeyRound,
            color: 'var(--gold)',
        },
    ];

    const securityRows = [
        { label: 'Password hashing', value: 'bcrypt (cost 12)' },
        { label: 'Session type', value: 'Server-side' },
        { label: 'Cookie flags', value: 'HttpOnly · SameSite' },
        { label: 'Transport', value: 'HTTPS enforced' },
        { label: 'CSRF protection', value: 'Flask-WTF' },
    ];

    return (
        <section style={{
            minHeight: 'calc(100vh - 3.75rem)',
            background: 'var(--bg-base)',
            position: 'relative',
        }}>
            <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

            {/* Ambient glow */}
            <div style={{
                position: 'absolute', top: '-80px', left: '-80px',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,184,58,0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div className="db-outer" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>

                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="db-header anim-fade-up" style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}>
                    <div>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.625rem',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: 'var(--gold)',
                            display: 'block',
                            marginBottom: '0.5rem',
                        }}>
                            ◈ Authenticated Session
                        </span>
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.1,
                            letterSpacing: '-0.01em',
                            marginBottom: '0.5rem',
                        }}>
                            Security Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                            Identity verified — multi-factor authentication active
                        </p>
                    </div>

                    {/* Status badge */}
                    <div className="db-badge" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem 1.125rem',
                        background: 'rgba(63,185,80,0.07)',
                        border: '1px solid rgba(63,185,80,0.25)',
                        borderRadius: 'var(--radius-lg)',
                        flexShrink: 0,
                    }}>
                        <CheckCircle size={16} color="var(--success)" strokeWidth={2} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>
                            Session Secured
                        </span>
                        <span style={{ width: '1px', height: '14px', background: 'rgba(63,185,80,0.3)', flexShrink: 0 }} />
                        <span className="db-badge-method" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            via {mfaLabel}
                        </span>
                    </div>
                </div>

                {/* ── Two-column layout ───────────────────────────────────── */}
                <div className="dashboard-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr',
                    gap: '1.5rem',
                    alignItems: 'start',
                }}>

                    {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Profile card */}
                        <div className="card anim-fade-up delay-1" style={{
                            padding: '2rem 1.5rem',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
                        }}>
                            <div style={{
                                width: '72px', height: '72px',
                                borderRadius: '50%',
                                background: 'var(--gold-dim)',
                                border: '2px solid var(--gold-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.25rem',
                                boxShadow: 'var(--shadow-gold)',
                            }}>
                                <ShieldCheck size={32} color="var(--gold)" strokeWidth={1.5} />
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.0625rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: '0.25rem',
                            }}>
                                {user?.username}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.6875rem',
                                color: 'var(--text-muted)',
                                letterSpacing: '0.05em',
                                marginBottom: '1.25rem',
                                wordBreak: 'break-all',
                            }}>
                                {user?.email}
                            </div>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.3rem 0.75rem',
                                background: 'var(--gold-dim)',
                                border: '1px solid var(--gold-border)',
                                borderRadius: '999px',
                                fontSize: '0.6875rem',
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--gold)',
                            }}>
                                <MFAIcon size={10} />
                                {mfaMethod}
                            </div>
                        </div>

                        {/* Account details */}
                        <div className="card anim-fade-up delay-2" style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                                <User size={14} color="var(--gold)" strokeWidth={1.75} />
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.5625rem',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: 'var(--text-muted)',
                                }}>
                                    Account Details
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    { label: 'Username', value: user?.username },
                                    { label: 'Email address', value: user?.email },
                                    { label: 'Phone number', value: user?.phone || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.5625rem',
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.2rem',
                                        }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, wordBreak: 'break-all' }}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline anim-fade-up delay-3"
                            style={{ gap: '0.5rem', width: '100%' }}
                        >
                            <LogOut size={15} />
                            Sign Out
                        </button>
                    </div>

                    {/* ── MAIN CONTENT ──────────────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* 2FA Method + Security cards */}
                        <div className="dashboard-top-row" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '1.25rem',
                        }}>

                            {/* 2FA Method card */}
                            <div className="card anim-fade-up delay-1" style={{ padding: '1.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: 'var(--radius)',
                                        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                                        flexShrink: 0,
                                    }}>
                                        <MFAIcon size={18} strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.0625rem' }}>
                                            2FA Method
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                                            Authentication factor
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {[
                                        { label: 'Active method', value: mfaLabel },
                                        { label: 'Status', value: 'Active', highlight: true },
                                        { label: 'Standard', value: mfaMethod === 'totp' ? 'RFC 6238' : 'HMAC-SHA256' },
                                        { label: 'Delivery', value: mfaMethod === 'totp' ? 'Authenticator app' : mfaMethod === 'sms' ? 'Twilio SMS' : 'Brevo REST' },
                                    ].map(({ label, value, highlight }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-faint)', gap: '0.5rem' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                {label}
                                            </span>
                                            <span style={{ fontSize: '0.8125rem', color: highlight ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Security card */}
                            <div className="card anim-fade-up delay-2" style={{ padding: '1.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: 'var(--radius)',
                                        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                                        flexShrink: 0,
                                    }}>
                                        <Lock size={18} strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.0625rem' }}>
                                            Security Posture
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                                            Active protections
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {securityRows.map(({ label, value }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-faint)', gap: '0.5rem' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                {label}
                                            </span>
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Switch 2FA Method panel ──────────────────────────── */}
                        <div className="card anim-fade-up delay-3" style={{ padding: '1.75rem' }}>

                            {/* Panel header */}
                            <div className="db-panel-header" style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                marginBottom: '1.5rem',
                                gap: '1rem',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: 'var(--radius)',
                                        background: 'rgba(232,184,58,0.08)', border: '1px solid rgba(232,184,58,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                                        flexShrink: 0,
                                    }}>
                                        <FlaskConical size={18} strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.0625rem' }}>
                                            Test 2FA Methods
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                                            Research / Demo Panel
                                        </div>
                                    </div>
                                </div>
                                <p className="db-panel-desc" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.6, textAlign: 'right' }}>
                                    Switch your active method then sign out and log in again to test the full flow.
                                    Current: <strong style={{ color: 'var(--gold)' }}>{mfaLabel}</strong>
                                </p>
                            </div>

                            {/* Phone input */}
                            <div className="db-phone-input" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>
                                    Phone number (required for SMS)
                                </label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="+447911123456"
                                    value={phoneInput}
                                    onChange={e => { setPhoneInput(e.target.value); setSwitchError(''); }}
                                    style={{ fontSize: '0.875rem' }}
                                />
                            </div>

                            {/* Method buttons */}
                            <div className="db-method-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '1rem',
                            }}>
                                {methodButtons.map(({ id, label, desc, Icon, color }) => {
                                    const isActive = mfaMethod === id;
                                    const isLoading = switching === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => handleSwitchMethod(id)}
                                            disabled={!!switching}
                                            style={{
                                                background: isActive ? 'rgba(232,184,58,0.08)' : 'var(--surface)',
                                                border: isActive ? '1px solid rgba(232,184,58,0.4)' : '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                padding: '1.25rem 1rem',
                                                cursor: switching ? 'not-allowed' : 'pointer',
                                                textAlign: 'left',
                                                opacity: switching && !isLoading ? 0.5 : 1,
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                                                {isLoading
                                                    ? <RefreshCw size={17} color={color} style={{ animation: 'spin 1s linear infinite' }} />
                                                    : <Icon size={17} color={color} strokeWidth={1.75} />
                                                }
                                                {isActive && (
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', background: 'var(--gold-dim)', padding: '0.2rem 0.4rem', borderRadius: '3px', border: '1px solid var(--gold-border)' }}>
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                                                {label}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                                {desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {switchError && (
                                <div className="alert alert-error" style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
                                    {switchError}
                                </div>
                            )}
                            {switchSuccess && (
                                <div style={{
                                    marginTop: '1rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius)',
                                    background: 'rgba(63,185,80,0.07)', border: '1px solid rgba(63,185,80,0.25)',
                                    color: 'var(--success)', fontSize: '0.8125rem',
                                }}>
                                    {switchSuccess}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }

                /* ── Base (mobile-first) ───────────────────────────── */
                .db-outer {
                    padding: 0 1rem 2.5rem;
                }
                .db-header {
                    padding: 1.75rem 0 1.5rem;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                }
                .db-badge {
                    width: 100%;
                    justify-content: flex-start;
                }
                .db-badge-method {
                    display: none;
                }
                .dashboard-grid {
                    grid-template-columns: 1fr !important;
                }
                .dashboard-top-row {
                    grid-template-columns: 1fr !important;
                }
                .db-panel-header {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                }
                .db-panel-desc {
                    text-align: left !important;
                    max-width: 100% !important;
                }
                .db-phone-input {
                    max-width: 100% !important;
                }
                .db-method-grid {
                    grid-template-columns: 1fr !important;
                }

                /* ── Tablet: 480px+ ────────────────────────────────── */
                @media (min-width: 480px) {
                    .db-outer {
                        padding: 0 1.25rem 2.75rem;
                    }
                    .db-badge-method {
                        display: inline;
                    }
                    .db-method-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }

                /* ── Tablet: 640px+ ────────────────────────────────── */
                @media (min-width: 640px) {
                    .db-outer {
                        padding: 0 1.5rem 3rem;
                    }
                    .db-header {
                        padding: 2rem 0 1.75rem;
                        flex-direction: row;
                        align-items: flex-end;
                        gap: 1.5rem;
                    }
                    .db-badge {
                        width: auto;
                    }
                    .dashboard-top-row {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    .db-panel-header {
                        flex-direction: row !important;
                        align-items: flex-start !important;
                    }
                    .db-panel-desc {
                        text-align: right !important;
                        max-width: 340px !important;
                    }
                    .db-phone-input {
                        max-width: 320px !important;
                    }
                }

                /* ── Desktop: 960px+ ───────────────────────────────── */
                @media (min-width: 960px) {
                    .db-outer {
                        padding: 0 2rem 3rem;
                    }
                    .db-header {
                        padding: 2.5rem 0 2rem;
                    }
                    .dashboard-grid {
                        grid-template-columns: 300px 1fr !important;
                    }
                }

                /* ── Wide: 1200px+ ─────────────────────────────────── */
                @media (min-width: 1200px) {
                    .db-outer {
                        padding: 0 2.5rem 3rem;
                    }
                }
            `}</style>
        </section>
    );
}
