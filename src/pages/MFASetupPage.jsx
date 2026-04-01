import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Copy, CheckCircle, QrCode, ArrowRight } from 'lucide-react';
import { getTOTPSetup, verifyTOTP } from '../utils/api';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   OTP Input: 6 individual digit boxes
   ───────────────────────────────────────────── */
function OTPInput({ onChange }) {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const containerRef = useRef(null);

    const getInputs = () =>
        Array.from(containerRef.current?.querySelectorAll('input') ?? []);

    const updateDigits = useCallback((next) => {
        setDigits(next);
        onChange(next.join(''));
    }, [onChange]);

    const handleChange = (i, e) => {
        const val = e.target.value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = val;
        updateDigits(next);
        if (val && i < 5) getInputs()[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) {
            const next = [...digits];
            next[i - 1] = '';
            updateDigits(next);
            getInputs()[i - 1]?.focus();
        } else if (e.key === 'ArrowLeft'  && i > 0) getInputs()[i - 1]?.focus();
        else if  (e.key === 'ArrowRight' && i < 5) getInputs()[i + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = Array(6).fill('');
        pasted.split('').forEach((c, i) => { next[i] = c; });
        updateDigits(next);
        const focusIdx = Math.min(pasted.length, 5);
        getInputs()[focusIdx]?.focus();
    };

    return (
        <div ref={containerRef} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {digits.map((d, i) => (
                <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleChange(i, e)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={`otp-digit${d ? ' filled' : ''}`}
                    aria-label={`Digit ${i + 1} of 6`}
                />
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Page
   ───────────────────────────────────────────── */
export default function MFASetupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshUser } = useAuth();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [setupLoading, setSetupLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [manualKey, setManualKey] = useState('');
    const [setupError, setSetupError] = useState('');

    // verifyOnly=true means user already has TOTP set up; just needs to enter code
    const verifyOnly = location.state?.verifyOnly || false;

    useEffect(() => {
        if (verifyOnly) {
            setSetupLoading(false);
            return;
        }
        getTOTPSetup()
            .then(data => {
                if (data.success) {
                    setQrCode(data.qr_code_base64);
                    setManualKey(data.manual_key);
                } else {
                    setSetupError(data.message || 'Failed to load TOTP setup.');
                }
            })
            .catch(() => setSetupError('Network error loading TOTP setup.'))
            .finally(() => setSetupLoading(false));
    }, [verifyOnly]);

    const handleCopy = async () => {
        const keyToCopy = manualKey;
        try {
            await navigator.clipboard.writeText(keyToCopy);
        } catch {
            const el = document.createElement('textarea');
            el.value = keyToCopy;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVerify = async e => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Please enter all 6 digits.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await verifyTOTP(code);
            if (result.success) {
                await refreshUser();
                setVerified(true);
            } else {
                setError(result.message || 'Invalid code.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ─ Success screen ─ */
    if (verified) {
        return (
            <section style={{
                minHeight: 'calc(100vh - 3.75rem)',
                background: 'var(--bg-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1.5rem',
            }}>
                <div className="anim-fade-up" style={{ textAlign: 'center', maxWidth: '480px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(63,185,80,0.1)',
                        border: '1px solid rgba(63,185,80,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.75rem',
                        color: 'var(--success)',
                    }}>
                        <CheckCircle size={38} strokeWidth={1.5} />
                    </div>
                    <h1 className="display-heading" style={{
                        fontSize: '2rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.875rem',
                    }}>
                        MFA Activated
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        lineHeight: 1.75,
                        marginBottom: '2rem',
                    }}>
                        Your account is now protected with two-factor authentication.
                        Future logins will require a code from your authenticator app.
                    </p>
                    <button
                        className="btn btn-gold"
                        onClick={() => navigate('/dashboard', { replace: true })}
                        style={{ marginBottom: '1.25rem' }}
                    >
                        Go to Dashboard <ArrowRight size={16} />
                    </button>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1.125rem',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(63,185,80,0.08)',
                        border: '1px solid rgba(63,185,80,0.2)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6875rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--success)',
                    }}>
                        <CheckCircle size={13} />
                        TOTP Enrollment Complete
                    </div>
                </div>
            </section>
        );
    }

    /* ─ Setup screen ─ */
    return (
        <section style={{
            minHeight: 'calc(100vh - 3.75rem)',
            background: 'var(--bg-base)',
            position: 'relative',
            padding: '3.5rem 0 4rem',
        }}>
            {/* Background */}
            <div className="dot-grid" style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.4,
                pointerEvents: 'none',
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '860px' }}>
                {/* ─ Header ─ */}
                <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    {/* Step indicator */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--gold-dim)',
                        border: '1px solid var(--gold-border)',
                        borderRadius: '2rem',
                        padding: '0.375rem 0.875rem',
                        marginBottom: '1.25rem',
                    }}>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.5625rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'var(--gold)',
                        }}>
                            Step 2 of 2 — MFA Enrollment
                        </span>
                    </div>

                    <h1 className="display-heading" style={{
                        fontSize: 'clamp(1.625rem, 3vw, 2.125rem)',
                        color: 'var(--text-primary)',
                        marginBottom: '0.625rem',
                    }}>
                        Set Up Two-Factor Authentication
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.65,
                        maxWidth: '500px',
                        margin: '0 auto',
                    }}>
                        Scan the QR code with your authenticator app, then enter the 6-digit
                        code to finalise enrollment.
                    </p>
                </div>

                {/* ─ Split Card ─ */}
                <div className="card anim-fade-up delay-1" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    overflow: 'hidden',
                }}>
                    {/* ══ Left: QR + Secret Key ══ */}
                    <div style={{
                        padding: '2.5rem 2rem',
                        borderRight: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.75rem',
                    }}>
                        {/* Step label */}
                        <div style={{ textAlign: 'center', alignSelf: 'stretch' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.5625rem',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: 'var(--gold)',
                            }}>◈ Step 1</span>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginTop: '0.375rem',
                            }}>Scan QR Code</h3>
                        </div>

                        {/* QR Code */}
                        <div style={{
                            width: '192px',
                            height: '192px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            background: setupLoading ? 'var(--bg-elevated)' : '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            color: 'var(--text-muted)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {setupLoading ? (
                                <>
                                    <span className="spinner" style={{ color: 'var(--gold)' }} />
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading…</span>
                                </>
                            ) : setupError ? (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--danger)', textAlign: 'center', padding: '0.5rem' }}>{setupError}</span>
                            ) : qrCode ? (
                                <img src={qrCode} alt="TOTP QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <QrCode size={52} strokeWidth={1.25} />
                            )}
                        </div>

                        {/* Manual key */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <p style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.5625rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--text-muted)',
                                marginBottom: '0.625rem',
                            }}>
                                Or enter key manually:
                            </p>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.625rem',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius)',
                                padding: '0.625rem 1rem',
                            }}>
                                <code style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    fontSize: '0.9375rem',
                                    letterSpacing: '0.12em',
                                    color: 'var(--gold)',
                                }}>
                                    {manualKey || '—'}
                                </code>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    aria-label="Copy secret key"
                                    title="Copy to clipboard"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: copied ? 'var(--success)' : 'var(--text-muted)',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                                </button>
                            </div>
                            {copied && (
                                <p style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.5625rem',
                                    letterSpacing: '0.1em',
                                    color: 'var(--success)',
                                    marginTop: '0.5rem',
                                    textTransform: 'uppercase',
                                }}>
                                    Copied to clipboard
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ══ Right: Verify ══ */}
                    <div style={{
                        padding: '2.5rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.75rem',
                    }}>
                        {/* Step label */}
                        <div style={{ textAlign: 'center' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.5625rem',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: 'var(--gold)',
                            }}>◈ Step 2</span>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginTop: '0.375rem',
                            }}>Enter Verification Code</h3>
                        </div>

                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            textAlign: 'center',
                            lineHeight: 1.7,
                            maxWidth: '290px',
                        }}>
                            Open your authenticator app and enter the 6-digit code displayed for SecureAuth.
                        </p>

                        <form onSubmit={handleVerify} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.25rem',
                            width: '100%',
                        }}>
                            <OTPInput onChange={setCode} />

                            {error && (
                                <p style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.625rem',
                                    letterSpacing: '0.08em',
                                    color: 'var(--danger)',
                                    textAlign: 'center',
                                }}>
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="btn btn-gold"
                                disabled={loading || code.length !== 6}
                                style={{
                                    width: '100%',
                                    maxWidth: '280px',
                                    justifyContent: 'center',
                                }}
                            >
                                {loading ? (
                                    <><span className="spinner" /> Verifying…</>
                                ) : (
                                    <><ShieldCheck size={16} /> Verify &amp; Activate <ArrowRight size={14} /></>
                                )}
                            </button>

                            {/* Helper text */}
                            <p style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.5625rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--text-muted)',
                                textAlign: 'center',
                            }}>
                                Code refreshes every 30 seconds
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
