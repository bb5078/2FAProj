/**
 * PasswordResetPage — two states:
 *   1. Request form: user enters email → receives reset link
 *   2. Confirm form: user arrives via email link with ?token= → enters new password
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, CheckCircle, ArrowRight } from 'lucide-react';
import { resetRequest, resetConfirm } from '../utils/api';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export default function PasswordResetPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    return token ? <ConfirmForm token={token} /> : <RequestForm />;
}

// ── Request form ──────────────────────────────────────────────────────────────

function RequestForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Email is required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await resetRequest(email.trim().toLowerCase());
            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.message || 'Something went wrong.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return <SuccessCard
            title="Check your inbox"
            message="If an account exists for that email, a reset link has been sent. It expires in 1 hour."
            linkTo="/login"
            linkLabel="Back to Sign In"
        />;
    }

    return (
        <FormShell icon={<KeyRound size={24} strokeWidth={1.75} />} title="Reset Password" subtitle="Enter your email and we'll send you a reset link.">
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="reset-email" className="form-label">Email Address</label>
                    <input
                        id="reset-email"
                        type="email"
                        className="form-input"
                        placeholder="you@university.edu"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        required
                        autoComplete="email"
                    />
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {loading ? <><span className="spinner" /> Sending…</> : <>Send Reset Link <ArrowRight size={16} /></>}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
                    Remembered it?{' '}
                    <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 500 }}>Sign in</Link>
                </p>
            </form>
        </FormShell>
    );
}

// ── Confirm form ──────────────────────────────────────────────────────────────

function ConfirmForm({ token }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }

        setLoading(true);
        setError('');
        try {
            const result = await resetConfirm(token, password);
            if (result.success) setDone(true);
            else setError(result.message || 'Reset failed. The link may have expired.');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return <SuccessCard
            title="Password updated"
            message="Your password has been reset successfully. You can now sign in."
            linkTo="/login"
            linkLabel="Sign In"
        />;
    }

    return (
        <FormShell icon={<KeyRound size={24} strokeWidth={1.75} />} title="Set New Password" subtitle="Choose a strong password for your account.">
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="new-password" className="form-label">New Password</label>
                    <input
                        id="new-password"
                        type="password"
                        className="form-input"
                        placeholder="Minimum 8 characters"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        required
                        autoComplete="new-password"
                    />
                    <PasswordStrengthMeter password={password} />
                </div>
                <div className="form-group">
                    <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        className="form-input"
                        placeholder="Repeat new password"
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); setError(''); }}
                        required
                        autoComplete="new-password"
                    />
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {loading ? <><span className="spinner" /> Updating…</> : <>Update Password <ArrowRight size={16} /></>}
                </button>
            </form>
        </FormShell>
    );
}

// ── Shared layout ─────────────────────────────────────────────────────────────

function FormShell({ icon, title, subtitle, children }) {
    return (
        <section style={{
            minHeight: 'calc(100vh - 3.75rem)',
            background: 'var(--bg-base)',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '3rem 1.5rem',
        }}>
            <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
                <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.125rem', color: 'var(--gold)', boxShadow: 'var(--shadow-gold)',
                    }}>
                        {icon}
                    </div>
                    <h1 className="display-heading" style={{ fontSize: '1.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {title}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                        {subtitle}
                    </p>
                </div>
                <div className="card anim-fade-up delay-1" style={{ padding: '2rem' }}>
                    {children}
                </div>
            </div>
        </section>
    );
}

function SuccessCard({ title, message, linkTo, linkLabel }) {
    return (
        <FormShell icon={<CheckCircle size={24} strokeWidth={1.75} />} title={title} subtitle={message}>
            <Link to={linkTo} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                {linkLabel} <ArrowRight size={16} />
            </Link>
        </FormShell>
    );
}
