import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, LogOut, User, Mail, Smartphone, KeyRound, Lock,
    RefreshCw, FlaskConical, Database, History, Server,
    ChevronDown, CheckCircle, XCircle, Clock, Hash,
    AlertTriangle, Fingerprint, Layers, Settings,
    Unlock, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthInternals, setMfaMethod } from '../utils/api';

/* ─────────────────────────── helpers ─────────────────────────── */

function Badge({ label, color = '#E8B83A', dim = false }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            background: dim ? `${color}12` : `${color}20`,
            border: `1px solid ${color}40`,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
        }}>
            {label}
        </span>
    );
}

function Field({ label, children, mono = false }) {
    return (
        <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                {label}
            </div>
            <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: mono ? '0.75rem' : '0.875rem', color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {children}
            </div>
        </div>
    );
}

function HashDisplay({ value, algorithm }) {
    const [revealed, setRevealed] = useState(false);
    if (!value) return <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>—</span>;
    const preview = revealed ? value : value.slice(0, 8) + '••••••••••••••••••••••••••••••••••••••••••••••••••••••' + value.slice(-4);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: '#0b0f16', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
            <Hash size={13} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                {algorithm && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.3rem' }}>{algorithm}</div>
                )}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#d7dde7', wordBreak: 'break-all', lineHeight: 1.5 }}>{preview}</div>
            </div>
            <button onClick={() => setRevealed(r => !r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0', flexShrink: 0 }} title={revealed ? 'Hide' : 'Reveal'}>
                {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
        </div>
    );
}

function EncryptedDisplay({ label = 'Encrypted at rest' }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0b0f16', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' }}>
            <Lock size={13} color="#34D399" style={{ flexShrink: 0 }} />
            <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#34D399', marginBottom: '0.2rem' }}>Fernet / AES-128-CBC</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>████████████████████████████████████████</div>
            </div>
            <Badge label={label} color="#34D399" />
        </div>
    );
}

function fmtDate(val) {
    if (!val) return '—';
    try { return new Date(val).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return String(val); }
}

function StatusDot({ ok }) {
    return (
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: ok ? '#34D399' : '#F43F5E', boxShadow: ok ? '0 0 6px #34D39980' : '0 0 6px #F43F5E80', marginRight: '0.375rem' }} />
    );
}

/* ─────────────────────── record renderers ─────────────────────── */

function UserRecordView({ data }) {
    if (!data) return <EmptyState />;
    const maxAttempts = 5;
    const attempts = data.failed_attempts ?? 0;
    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Identity row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                <Field label="Username">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.username ?? '—'}</span>
                </Field>
                <Field label="Email">{data.email ?? '—'}</Field>
                <Field label="Phone">{data.phone || <span style={{ color: 'var(--text-muted)' }}>Not set</span>}</Field>
            </div>

            {/* Status badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <Badge label={data.is_locked ? 'Account Locked' : 'Account Active'} color={data.is_locked ? '#F43F5E' : '#34D399'} />
                <Badge label={data.totp_enabled ? 'TOTP Enabled' : 'TOTP Disabled'} color={data.totp_enabled ? '#E8B83A' : '#94A3B8'} />
                <Badge label={`ID: ${data.id ?? '—'}`} color="#64748B" />
            </div>

            {/* Password hash */}
            <Field label="Password Hash — bcrypt cost ≥ 12">
                <HashDisplay value={data.password_hash} algorithm="bcrypt · Adaptive cost factor · Salted" />
            </Field>

            {/* Brute-force counter */}
            <Field label={`Failed login attempts (lockout at ${maxAttempts})`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {Array.from({ length: maxAttempts }).map((_, i) => (
                            <div key={i} style={{ width: '20px', height: '8px', borderRadius: '3px', background: i < attempts ? '#F43F5E' : 'var(--border-subtle)', transition: 'background 0.2s' }} />
                        ))}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: attempts > 0 ? '#F43F5E' : 'var(--text-muted)' }}>
                        {attempts} / {maxAttempts}
                    </span>
                </div>
            </Field>

            {/* Timestamps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
                <Field label="Account Created"><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{fmtDate(data.created_at)}</span></Field>
            </div>
        </div>
    );
}

function SessionRecordView({ data }) {
    if (!data) return <EmptyState />;
    const isAuth = data.is_fully_authenticated;
    const expiry = data.expires_at ? new Date(data.expires_at) : null;
    const expired = expiry && expiry < new Date();
    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Auth status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: isAuth ? 'rgba(52,211,153,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${isAuth ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)'}`, borderRadius: 'var(--radius)', flexWrap: 'wrap', gap: '0.75rem' }}>
                {isAuth ? <CheckCircle size={20} color="#34D399" /> : <AlertTriangle size={20} color="#FBBF24" />}
                <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: isAuth ? '#34D399' : '#FBBF24' }}>
                        {isAuth ? 'Fully Authenticated' : 'Partial — Pending 2FA'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {isAuth ? 'Password + second factor both verified' : 'Password step passed, second factor not yet completed'}
                    </div>
                </div>
            </div>

            {/* Token preview */}
            <Field label="Server-side session token (masked)">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0b0f16', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
                    <Fingerprint size={14} color="#4DA6FF" style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#d7dde7', letterSpacing: '0.05em', wordBreak: 'break-all' }}>
                        {data.token_preview ?? '••••••••••••••••••••••••••••••••'}
                    </span>
                    <Badge label="HttpOnly cookie" color="#4DA6FF" />
                </div>
            </Field>

            {/* Meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                <Field label="Expires at">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={13} color={expired ? '#F43F5E' : '#34D399'} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: expired ? '#F43F5E' : 'var(--text-secondary)' }}>
                            {fmtDate(data.expires_at)}
                        </span>
                        {expired && <Badge label="Expired" color="#F43F5E" />}
                    </div>
                </Field>
                <Field label="Created at">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{fmtDate(data.created_at)}</span>
                </Field>
                {data.ip_address && (
                    <Field label="IP Address">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{data.ip_address}</span>
                    </Field>
                )}
            </div>
        </div>
    );
}

const EVENT_COLORS = {
    login:         '#4DA6FF',
    logout:        '#94A3B8',
    register:      '#34D399',
    otp_send:      '#A78BFA',
    otp_verify:    '#A78BFA',
    totp_setup:    '#E8B83A',
    totp_verify:   '#E8B83A',
    lockout:       '#F43F5E',
    reset_request: '#F97316',
    reset_confirm: '#F97316',
};

function AuthLogsView({ data }) {
    if (!Array.isArray(data) || data.length === 0) return <EmptyState label="No auth events recorded yet" />;
    return (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
            {data.map((log, i) => {
                const color = EVENT_COLORS[log.event_type] ?? '#94A3B8';
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', flexWrap: 'wrap' }}>
                        {/* status dot + timeline line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2px' }}>
                            {log.success
                                ? <CheckCircle size={15} color="#34D399" strokeWidth={2} />
                                : <XCircle size={15} color="#F43F5E" strokeWidth={2} />
                            }
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.375rem 1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {log.event_type?.replace(/_/g, ' ') ?? '—'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                {log.method && <Badge label={log.method} color={color} />}
                                <Badge label={log.success ? 'Pass' : 'Fail'} color={log.success ? '#34D399' : '#F43F5E'} />
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {fmtDate(log.timestamp)}
                            </div>
                            {log.ip_address && (
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    {log.ip_address}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function OtpRecordsView({ data }) {
    if (!Array.isArray(data) || data.length === 0) return <EmptyState label="No OTP records for this user" />;
    return (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
            {data.map((rec, i) => {
                const expired = rec.expires_at && new Date(rec.expires_at) < new Date();
                return (
                    <div key={i} style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                <Badge label={rec.method ?? 'unknown'} color={rec.method === 'sms' ? '#A78BFA' : '#4DA6FF'} />
                                <Badge label={rec.is_used ? 'Used' : 'Unused'} color={rec.is_used ? '#94A3B8' : '#34D399'} />
                                {expired && <Badge label="Expired" color="#F43F5E" />}
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                Expires: {fmtDate(rec.expires_at)}
                            </span>
                        </div>
                        <Field label="Code hash — plaintext never stored">
                            <HashDisplay value={rec.code_hash} algorithm="SHA-256 · One-way · Replay-protected" />
                        </Field>
                    </div>
                );
            })}
        </div>
    );
}

function TotpSecretsView({ data }) {
    if (!Array.isArray(data) || data.length === 0) return <EmptyState label="No TOTP secrets — enrol via 2FA Methods tab" />;
    return (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
            {data.map((rec, i) => (
                <div key={i} style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            <Badge label="RFC 6238 TOTP" color="#E8B83A" />
                            <Badge label={rec.is_active ? 'Active' : 'Inactive'} color={rec.is_active ? '#34D399' : '#94A3B8'} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            Created: {fmtDate(rec.created_at)}
                        </span>
                    </div>
                    <Field label="Authenticator secret — encrypted at rest">
                        <EncryptedDisplay label="Encrypted at rest" />
                    </Field>
                </div>
            ))}
        </div>
    );
}

function SecurityControlsView({ data }) {
    if (!data || Object.keys(data).length === 0) return <EmptyState />;

    const items = [
        { key: 'session_storage',    label: 'Session Storage',       icon: Server,      desc: data.session_storage,    color: '#4DA6FF' },
        { key: 'otp_storage',        label: 'OTP Storage',           icon: Hash,        desc: data.otp_storage,        color: '#A78BFA' },
        { key: 'totp_storage',       label: 'TOTP Secret Storage',   icon: Lock,        desc: data.totp_storage,       color: '#34D399' },
        { key: 'max_login_attempts', label: 'Max Login Attempts',    icon: AlertTriangle, desc: data.max_login_attempts !== undefined ? `Lockout after ${data.max_login_attempts} failures` : undefined, color: '#F43F5E' },
        { key: 'session_expiry',     label: 'Session Expiry',        icon: Clock,       desc: data.session_expiry_minutes ? `${data.session_expiry_minutes} minutes` : data.session_expiry, color: '#E8B83A' },
        { key: 'otp_expiry',         label: 'OTP Expiry',            icon: Clock,       desc: data.otp_expiry_minutes ? `${data.otp_expiry_minutes} minutes` : data.otp_expiry, color: '#F97316' },
    ].filter(item => item.desc !== undefined && item.desc !== null);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
            {items.map(({ key, label, icon: Icon, desc, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '1rem', background: 'var(--bg-elevated)', border: `1px solid ${color}20`, borderRadius: 'var(--radius)' }}>
                    <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: 'var(--radius)', background: `${color}12`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                        <Icon size={14} strokeWidth={1.75} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, wordBreak: 'break-word' }}>{String(desc)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ label = 'No data available' }) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
            {label}
        </div>
    );
}

/* ─────────────────── collapsible panel wrapper ─────────────────── */

function Panel({ title, subtitle, accentColor, icon: PanelIcon, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{
            border: `1px solid ${open ? accentColor + '35' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
            background: 'var(--bg-surface)',
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '1rem 1.25rem',
                    background: open ? `${accentColor}07` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    textAlign: 'left',
                }}
            >
                <div style={{ width: '34px', height: '34px', minWidth: '34px', borderRadius: 'var(--radius)', background: `${accentColor}15`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                    <PanelIcon size={15} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{subtitle}</div>
                </div>
                <div style={{
                    width: '26px', height: '26px', minWidth: '26px',
                    borderRadius: '50%',
                    border: `1px solid ${accentColor}35`,
                    background: `${accentColor}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accentColor,
                    transition: 'transform 0.25s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                    <ChevronDown size={13} />
                </div>
            </button>

            {open && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: `1px solid ${accentColor}20` }}>
                    <div style={{ paddingTop: '1.25rem' }}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ────────────────── metric card ────────────────── */

function Metric({ icon: Icon, label, value }) {
    return (
        <div style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius)', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                    <Icon size={13} strokeWidth={1.75} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        </div>
    );
}

/* ────────────────── tab definitions ────────────────── */

const TABS = [
    { id: 'profile',   label: 'Profile',       Icon: User },
    { id: 'methods',   label: '2FA Methods',   Icon: FlaskConical },
    { id: 'internals', label: 'Auth Internals', Icon: Database },
];

/* ═══════════════════════ main page ═══════════════════════ */

export default function DashboardPage() {
    const { user, doLogout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
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
        try { setInternals(await getAuthInternals()); }
        catch { setInternalsError('Failed to refresh authentication internals.'); }
        finally { setInternalsLoading(false); }
    };

    const handleLogout = async () => {
        await doLogout();
        navigate('/login', { replace: true });
    };

    const handleSwitchMethod = async (method) => {
        setSwitchError(''); setSwitchSuccess('');
        if (method === 'totp') {
            setSwitching('totp');
            try { await setMfaMethod('totp'); navigate('/mfa-setup'); }
            catch { setSwitchError('Failed to initiate TOTP setup.'); }
            finally { setSwitching(null); }
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
        } catch { setSwitchError('Network error. Please try again.'); }
        finally { setSwitching(null); }
    };

    const methodButtons = [
        { id: 'email', label: 'Email OTP',            desc: 'Code sent to your email via Brevo REST API',       Icon: Mail,       color: '#4DA6FF' },
        { id: 'sms',   label: 'SMS OTP',              desc: 'Code sent to your phone via Twilio',               Icon: Smartphone, color: '#A78BFA' },
        { id: 'totp',  label: 'TOTP (Authenticator)', desc: 'RFC 6238 — Google Authenticator / Authy',          Icon: KeyRound,   color: 'var(--gold)' },
    ];

    const raw      = internals?.raw_records   || {};
    const overview = internals?.overview      || {};
    const controls = internals?.security_controls || {};

    return (
        <section className="db-section" style={{ minHeight: 'calc(100vh - 3.75rem)', background: 'var(--bg-base)', position: 'relative' }}>
            <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

                {/* ── page header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: '0.375rem' }}>
                            Authenticated Session
                        </span>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '0.375rem' }}>
                            Security Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Identity verified — multi-factor authentication active
                        </p>
                    </div>
                    {/* identity chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', flexShrink: 0 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={17} color="var(--gold)" strokeWidth={1.75} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{user?.username}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                                <MFAIcon size={9} color="var(--gold)" />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>{mfaMethod}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sign out"
                            style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s, border-color 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#F43F5E'; e.currentTarget.style.borderColor = '#F43F5E60'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>

                {/* ── tab bar ── */}
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '0.3rem' }}>
                    {TABS.map(({ id, label, Icon }) => {
                        const isActive = activeTab === id;
                        return (
                            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: 'calc(var(--radius) - 2px)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, transition: 'all 0.2s', background: isActive ? 'var(--gold-dim)' : 'transparent', color: isActive ? 'var(--gold)' : 'var(--text-muted)', boxShadow: isActive ? '0 0 0 1px var(--gold-border)' : 'none' }}>
                                <Icon size={13} strokeWidth={isActive ? 2 : 1.75} />
                                <span className="tab-label">{label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Tab: Profile ── */}
                {activeTab === 'profile' && (
                    <div style={{ display: 'grid', gap: '1rem', animation: 'fadeUp 0.2s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                            {[
                                { label: 'Username',     value: user?.username,         FieldIcon: User },
                                { label: 'Email address', value: user?.email,           FieldIcon: Mail },
                                { label: 'Phone number', value: user?.phone || 'Not set', FieldIcon: Smartphone },
                            ].map(({ label, value, FieldIcon }) => (
                                <div key={label} style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <FieldIcon size={13} color="var(--gold)" strokeWidth={1.75} />
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
                                    </div>
                                    <div style={{ fontFamily: label === 'Username' ? 'var(--font-display)' : 'var(--font-mono)', fontSize: label === 'Username' ? '1.0625rem' : '0.8125rem', fontWeight: label === 'Username' ? 700 : 400, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                                <MFAIcon size={13} color="var(--gold)" strokeWidth={1.75} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active MFA Method</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>{mfaLabel}</span>
                                <Badge label="Active" color="var(--gold)" />
                            </div>
                            <p style={{ marginTop: '0.625rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Switch methods from the 2FA Methods tab. Sign out and back in after switching to test the full flow.
                            </p>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline" style={{ gap: '0.5rem', width: '100%' }}>
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                )}

                {/* ── Tab: 2FA Methods ── */}
                {activeTab === 'methods' && (
                    <div style={{ display: 'grid', gap: '1.25rem', animation: 'fadeUp 0.2s ease' }}>
                        <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Currently active</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--gold)' }}>{mfaLabel}</div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Switch your active method below, then sign out and log back in to test the full flow.
                            </p>
                        </div>
                        <div>
                            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                                Phone number — required if switching to SMS
                            </label>
                            <input type="tel" className="form-input" placeholder="+447911123456" value={phoneInput} onChange={e => { setPhoneInput(e.target.value); setSwitchError(''); }} style={{ fontSize: '0.875rem', width: '100%' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            {methodButtons.map(({ id, label, desc, Icon, color }) => {
                                const isActive = mfaMethod === id;
                                const isLoading = switching === id;
                                return (
                                    <button key={id} onClick={() => handleSwitchMethod(id)} disabled={!!switching} style={{ background: isActive ? `${color}10` : 'var(--bg-surface)', border: isActive ? `1px solid ${color}50` : '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'left', cursor: switching ? 'not-allowed' : 'pointer', opacity: switching && !isLoading ? 0.5 : 1, transition: 'all 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius)', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {isLoading ? <RefreshCw size={16} color={color} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={16} color={color} strokeWidth={1.75} />}
                                            </div>
                                            {isActive && <Badge label="Active" color={color} />}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                        {switchError && <div className="alert alert-error">{switchError}</div>}
                        {switchSuccess && <div style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius)', background: 'rgba(63,185,80,0.07)', border: '1px solid rgba(63,185,80,0.25)', color: 'var(--success)', fontSize: '0.8125rem' }}>{switchSuccess}</div>}
                    </div>
                )}

                {/* ── Tab: Auth Internals ── */}
                {activeTab === 'internals' && (
                    <div style={{ display: 'grid', gap: '1.25rem', animation: 'fadeUp 0.2s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                    From-Scratch Authentication Internals
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                    Live database records for this authenticated session
                                </div>
                            </div>
                            <button type="button" onClick={refreshInternals} className="btn btn-outline" style={{ gap: '0.5rem' }}>
                                <RefreshCw size={14} /> Refresh
                            </button>
                        </div>

                        {internalsLoading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                                <span className="spinner" style={{ color: 'var(--gold)' }} />
                                <div style={{ marginTop: '0.875rem', fontSize: '0.875rem' }}>Loading authentication internals...</div>
                            </div>
                        ) : internalsError ? (
                            <div className="alert alert-error">{internalsError}</div>
                        ) : (
                            <>
                                {/* Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem' }}>
                                    <Metric icon={History}     label="Audit Events"  value={overview.auth_log_count ?? 0} />
                                    <Metric icon={Server}      label="Session Rows"  value={overview.active_session_count ?? 0} />
                                    <Metric icon={ShieldCheck} label="Active MFA"    value={(overview.active_mfa_method || '—').toUpperCase()} />
                                    <Metric icon={Lock}        label="OTP Records"   value={overview.otp_record_count ?? 0} />
                                </div>

                                {/* Collapsible record panels */}
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <Panel title="User Account Record" subtitle="users table · account state" accentColor="#E8B83A" icon={User} defaultOpen>
                                        <UserRecordView data={raw.user} />
                                    </Panel>

                                    <Panel title="Active Session Record" subtitle="sessions table · server-side token" accentColor="#4DA6FF" icon={Fingerprint}>
                                        <SessionRecordView data={raw.current_session} />
                                    </Panel>

                                    <Panel title="Auth Event Log" subtitle="auth_logs table · full audit trail" accentColor="#A78BFA" icon={History}>
                                        <AuthLogsView data={raw.auth_logs} />
                                    </Panel>

                                    <Panel title="OTP Code Records" subtitle="otp_codes table · hashed, single-use" accentColor="#F97316" icon={Hash}>
                                        <OtpRecordsView data={raw.otp_codes} />
                                    </Panel>

                                    <Panel title="TOTP Secret Records" subtitle="totp_secrets table · encrypted at rest" accentColor="#34D399" icon={KeyRound}>
                                        <TotpSecretsView data={raw.totp_secrets} />
                                    </Panel>

                                    <Panel title="Security Controls" subtitle="backend config · active protections" accentColor="#F43F5E" icon={Settings}>
                                        <SecurityControlsView data={controls} />
                                    </Panel>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .db-section {
                    font-family: 'DM Sans', sans-serif;
                    --font-display: 'DM Sans', sans-serif;
                }

                .db-section h1 {
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: -0.02em;
                }

                .db-section button,
                .db-section input,
                .db-section label {
                    font-family: inherit;
                }

                @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @media (max-width: 540px) { .tab-label { display: none; } }
            `}</style>
        </section>
    );
}
