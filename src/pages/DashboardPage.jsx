import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, LogOut, User, Mail, Smartphone, KeyRound, Lock,
    CheckCircle, RefreshCw, FlaskConical, Database, History, Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthInternals, setMfaMethod } from '../utils/api';

const EXPLANATIONS = {
    user: [
        ['password_hash', 'bcrypt output created by this app from the submitted password.'],
        ['failed_attempts', 'Increments on bad password submissions and supports account lockout.'],
        ['is_locked', 'Shows whether the app has locked the account after repeated failures.'],
        ['totp_enabled', 'Derived from the app-managed TOTP secret rows.'],
    ],
    session: [
        ['token_preview', 'Masked view of the server-side session token stored by this app.'],
        ['is_fully_authenticated', 'False after password step, true after OTP or TOTP verification.'],
        ['expires_at', 'Server-enforced session expiry time.'],
    ],
    logs: [
        ['event_type', 'Which auth event happened.'],
        ['method', 'Which factor/channel was used: password, email, sms, totp.'],
        ['success', 'Whether the event passed or failed.'],
        ['timestamp', 'When the event was written to auth_logs.'],
    ],
    otp: [
        ['code_hash', 'SHA-256 hash of the OTP. The plaintext code is not stored.'],
        ['is_used', 'Replay-prevention flag after successful verification.'],
        ['expires_at', 'OTP expiration time enforced by the backend.'],
    ],
    totp: [
        ['secret_encrypted', 'Encrypted authenticator secret stored by the app at rest.'],
        ['is_active', 'Whether that TOTP secret is the live one for the user.'],
    ],
    security: [
        ['session_storage', 'Sessions are stored in the project database, not in a third-party auth provider.'],
        ['otp_storage', 'OTP values are stored hashed only.'],
        ['totp_storage', 'TOTP secrets are stored encrypted.'],
        ['max_login_attempts', 'Threshold for lockout logic in the backend.'],
    ],
};

function Explain({ items }) {
    return (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
            {items.map(([key, text]) => (
                <div key={key} style={{ padding: '0.875rem 1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.35rem' }}>
                        {key}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {text}
                    </div>
                </div>
            ))}
        </div>
    );
}

function JsonCard({ title, subtitle, data }) {
    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '0.875rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {subtitle}
                </div>
            </div>
            <pre style={{ margin: 0, padding: '1rem', borderRadius: 'var(--radius)', background: '#0b0f16', border: '1px solid var(--border-subtle)', color: '#d7dde7', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

function Metric({ icon: Icon, label, value }) {
    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius)', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                    <Icon size={17} strokeWidth={1.75} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {label}
                </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {value}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, doLogout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [switching, setSwitching] = useState(null);
    const [phoneInput, setPhoneInput] = useState('');
    const [switchError, setSwitchError] = useState('');
    const [switchSuccess, setSwitchSuccess] = useState('');
    const [internals, setInternals] = useState(null);
    const [internalsLoading, setInternalsLoading] = useState(true);
    const [internalsError, setInternalsError] = useState('');

    const mfaMethod = user?.totp_enabled ? 'totp' : user?.phone ? 'sms' : 'email';
    const MFAIcon = mfaMethod === 'totp' ? KeyRound : mfaMethod === 'sms' ? Smartphone : Mail;
    const mfaLabel = mfaMethod === 'totp' ? 'TOTP Authenticator (RFC 6238)' : mfaMethod === 'sms' ? 'SMS OTP' : 'Email OTP';

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setInternalsLoading(true);
        setInternalsError('');
        getAuthInternals()
            .then(data => { if (!cancelled) setInternals(data); })
            .catch(() => { if (!cancelled) setInternalsError('Failed to load authentication internals.'); })
            .finally(() => { if (!cancelled) setInternalsLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const refreshInternals = async () => {
        setInternalsLoading(true);
        setInternalsError('');
        try {
            setInternals(await getAuthInternals());
        } catch {
            setInternalsError('Failed to refresh authentication internals.');
        } finally {
            setInternalsLoading(false);
        }
    };

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
                await refreshInternals();
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
        { id: 'email', label: 'Email OTP', desc: 'Code sent to your email via Brevo REST API', Icon: Mail, color: '#4DA6FF' },
        { id: 'sms', label: 'SMS OTP', desc: 'Code sent to your phone via Twilio', Icon: Smartphone, color: '#A78BFA' },
        { id: 'totp', label: 'TOTP (Authenticator)', desc: 'RFC 6238 - Google Authenticator / Authy', Icon: KeyRound, color: 'var(--gold)' },
    ];

    const raw = internals?.raw_records || {};
    const overview = internals?.overview || {};
    const controls = internals?.security_controls || {};

    return (
        <section style={{ minHeight: 'calc(100vh - 3.75rem)', background: 'var(--bg-base)', position: 'relative' }}>
            <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />
            <div className="db-outer" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '0 1rem 2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem', padding: '2rem 0 1.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: '0.5rem' }}>
                        Authenticated Session
                    </span>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Security Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                        Identity verified - multi-factor authentication active
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }} className="dash-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--gold-dim)', border: '2px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                                <ShieldCheck size={32} color="var(--gold)" strokeWidth={1.5} />
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user?.username}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', wordBreak: 'break-all' }}>{user?.email}</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: '999px', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                                <MFAIcon size={10} />
                                {mfaMethod}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                                <User size={14} color="var(--gold)" strokeWidth={1.75} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                    Account Details
                                </span>
                            </div>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {[['Username', user?.username], ['Email address', user?.email], ['Phone number', user?.phone || '-']].map(([label, value]) => (
                                    <div key={label}>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleLogout} className="btn btn-outline" style={{ gap: '0.5rem', width: '100%' }}>
                            <LogOut size={15} />
                            Sign Out
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: '1.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }} className="stack-mobile">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius)', background: 'rgba(232,184,58,0.08)', border: '1px solid rgba(232,184,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                                        <FlaskConical size={18} strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.0625rem' }}>Test 2FA Methods</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.125rem' }}>Research / Demo Panel</div>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.6, maxWidth: '360px' }}>
                                    Switch your active method then sign out and log in again to test the full flow. Current: <strong style={{ color: 'var(--gold)' }}>{mfaLabel}</strong>
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.25rem', maxWidth: '320px' }}>
                                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>
                                    Phone number (required for SMS)
                                </label>
                                <input type="tel" className="form-input" placeholder="+447911123456" value={phoneInput} onChange={e => { setPhoneInput(e.target.value); setSwitchError(''); }} style={{ fontSize: '0.875rem' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }} className="method-grid">
                                {methodButtons.map(({ id, label, desc, Icon, color }) => {
                                    const isActive = mfaMethod === id;
                                    const isLoading = switching === id;
                                    return (
                                        <button key={id} onClick={() => handleSwitchMethod(id)} disabled={!!switching} style={{ background: isActive ? 'rgba(232,184,58,0.08)' : 'var(--surface)', border: isActive ? '1px solid rgba(232,184,58,0.4)' : '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1rem', textAlign: 'left', opacity: switching && !isLoading ? 0.5 : 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                                                {isLoading ? <RefreshCw size={17} color={color} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={17} color={color} strokeWidth={1.75} />}
                                                {isActive && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>Active</span>}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            {switchError && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{switchError}</div>}
                            {switchSuccess && <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius)', background: 'rgba(63,185,80,0.07)', border: '1px solid rgba(63,185,80,0.25)', color: 'var(--success)', fontSize: '0.8125rem' }}>{switchSuccess}</div>}
                        </div>

                        <div className="card" style={{ padding: '1.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }} className="stack-mobile">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius)', background: 'rgba(77,166,255,0.08)', border: '1px solid rgba(77,166,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4DA6FF' }}>
                                        <Database size={18} strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.0625rem' }}>From-Scratch Authentication Internals</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.125rem' }}>Real records for this user</div>
                                    </div>
                                </div>
                                <button type="button" onClick={refreshInternals} className="btn btn-outline" style={{ gap: '0.5rem' }}>
                                    <RefreshCw size={14} />
                                    Refresh
                                </button>
                            </div>

                            {internalsLoading ? (
                                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <span className="spinner" style={{ color: 'var(--gold)', marginBottom: '0.75rem' }} />
                                    <div style={{ marginTop: '0.75rem' }}>Loading authentication internals...</div>
                                </div>
                            ) : internalsError ? (
                                <div className="alert alert-error">{internalsError}</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="metrics-grid">
                                        <Metric icon={History} label="Audit Events" value={overview.auth_log_count ?? 0} />
                                        <Metric icon={Server} label="Session Rows" value={overview.active_session_count ?? 0} />
                                        <Metric icon={ShieldCheck} label="Active MFA" value={(overview.active_mfa_method || '-').toUpperCase()} />
                                        <Metric icon={Lock} label="OTP Records" value={overview.otp_record_count ?? 0} />
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {[
                                            'This project stores and verifies authentication state in its own backend and database.',
                                            'Sessions are server-side rows, not JWTs outsourced to a third-party identity service.',
                                            'OTP values are stored hashed, TOTP secrets are stored encrypted, and all auth events are written to an audit log.',
                                        ].map(item => (
                                            <div key={item} style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                                {item}
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }} className="internals-grid">
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <JsonCard title="Raw User Record" subtitle="Current account state from the users table." data={raw.user} />
                                            <Explain items={EXPLANATIONS.user} />
                                        </div>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <JsonCard title="Current Session Record" subtitle="Server-side session state for this authenticated request." data={raw.current_session} />
                                            <Explain items={EXPLANATIONS.session} />
                                        </div>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <JsonCard title="Raw Auth Log History" subtitle="Recent audit trail entries from auth_logs." data={raw.auth_logs} />
                                            <Explain items={EXPLANATIONS.logs} />
                                        </div>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <JsonCard title="Raw OTP Records" subtitle="Recent OTP rows showing hash storage, expiry, and replay state." data={raw.otp_codes} />
                                            <Explain items={EXPLANATIONS.otp} />
                                        </div>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <JsonCard title="Raw TOTP Secret Records" subtitle="Encrypted authenticator secrets written by the app." data={raw.totp_secrets} />
                                            <Explain items={EXPLANATIONS.totp} />
                                        </div>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <JsonCard title="Security Controls Snapshot" subtitle="Current backend protections and config values affecting this user." data={controls} />
                                            <Explain items={EXPLANATIONS.security} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 959px) { .dash-grid, .internals-grid, .metrics-grid, .method-grid { grid-template-columns: 1fr !important; } }
                @media (max-width: 639px) { .stack-mobile { flex-direction: column !important; } }
            `}</style>
        </section>
    );
}
