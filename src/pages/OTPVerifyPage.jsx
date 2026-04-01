/**
 * OTPVerifyPage — Step 2 of login for Email / SMS OTP method.
 *
 * Expects React Router location.state.method = 'email' | 'sms'
 * (set by LoginPage after successful password verification).
 * Automatically sends the OTP on mount.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Smartphone, Shield, RotateCcw } from 'lucide-react';
import { sendOTP, verifyOTP } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function OTPVerifyPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshUser } = useAuth();

    const method = location.state?.method || 'email';
    const MethodIcon = method === 'sms' ? Smartphone : Mail;

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef([]);
    const hasSentRef = useRef(false);  // guard against StrictMode double-invoke

    // Send OTP on mount — ref guard ensures exactly one send even in StrictMode
    useEffect(() => {
        if (hasSentRef.current) return;
        hasSentRef.current = true;
        handleSendOTP();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Resend countdown
    useEffect(() => {
        if (countdown <= 0) return;
        const id = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [countdown]);

    const handleSendOTP = useCallback(async () => {
        setSending(true);
        setError('');
        try {
            const result = await sendOTP(method);
            if (!result.success) setError(result.message || 'Failed to send code.');
            else setCountdown(60);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSending(false);
        }
    }, [method]);

    const handleDigitChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...code];
        next[index] = value;
        setCode(next);
        setError('');
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const codeStr = code.join('');
        if (codeStr.length !== 6) {
            setError('Enter all 6 digits.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await verifyOTP(codeStr);
            if (result.success) {
                await refreshUser();
                navigate('/dashboard', { replace: true });
            } else {
                setError(result.message || 'Invalid code.');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const codeComplete = code.every(d => d !== '');

    return (
        <section style={{
            minHeight: 'calc(100vh - 3.75rem)',
            background: 'var(--bg-base)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1.5rem',
        }}>
            <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -60%)',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,184,58,0.05) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
                {/* Header */}
                <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.125rem', color: 'var(--gold)', boxShadow: 'var(--shadow-gold)',
                    }}>
                        <MethodIcon size={24} strokeWidth={1.75} />
                    </div>
                    <h1 className="display-heading" style={{ fontSize: '1.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Enter Verification Code
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                        {method === 'email'
                            ? 'A 6-digit code was sent to your email address.'
                            : 'A 6-digit code was sent to your phone.'}
                    </p>
                </div>

                {/* Card */}
                <div className="card anim-fade-up delay-1" style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit} noValidate>
                        {/* OTP digits */}
                        <div style={{
                            display: 'flex', gap: '0.625rem', justifyContent: 'center', marginBottom: '1.75rem',
                        }}>
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => inputRefs.current[i] = el}
                                    className={`otp-digit${digit ? ' filled' : ''}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleDigitChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    onPaste={i === 0 ? handlePaste : undefined}
                                    autoFocus={i === 0}
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>

                        {/* Step indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <div style={{ flex: 1, height: '2px', background: 'var(--gold)', borderRadius: '1px' }} />
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: 'var(--text-muted)', whiteSpace: 'nowrap',
                            }}>Step 2 of 2</span>
                            <div style={{ flex: 1, height: '2px', background: 'var(--gold)', borderRadius: '1px' }} />
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-gold"
                            disabled={loading || !codeComplete}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {loading ? <><span className="spinner" /> Verifying…</> : 'Verify Code'}
                        </button>

                        {/* Resend */}
                        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                            {countdown > 0 ? (
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Resend available in {countdown}s
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={sending}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--gold)', fontSize: '0.875rem', display: 'inline-flex',
                                        alignItems: 'center', gap: '0.375rem',
                                    }}
                                >
                                    <RotateCcw size={14} />
                                    {sending ? 'Sending…' : 'Resend code'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <hr className="divider-gold" style={{ marginTop: '2rem', opacity: 0.5 }} />
                <p style={{
                    textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                    letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '1rem',
                }}>
                    OTP secured · SHA-256 hash · {parseInt(import.meta.env.VITE_OTP_EXPIRY || '5')}min expiry
                </p>
            </div>
        </section>
    );
}
