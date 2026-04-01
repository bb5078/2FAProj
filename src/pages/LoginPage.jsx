import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { login as apiLogin } from '../utils/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = e => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await apiLogin(formData);
            if (result.success) {
                // Route to correct 2FA step based on method returned by backend
                if (result.method === 'totp') {
                    navigate('/mfa-setup', { state: { verifyOnly: true } });
                } else {
                    navigate('/verify-otp', { state: { method: result.method } });
                }
            } else {
                setError(result.message || 'Invalid credentials.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

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
            {/* Background pattern */}
            <div className="dot-grid" style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.4,
                pointerEvents: 'none',
            }} />

            {/* Gold glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -60%)',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,184,58,0.05) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '420px',
            }}>
                {/* ─ Header ─ */}
                <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: 'var(--gold-dim)',
                        border: '1px solid var(--gold-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.125rem',
                        color: 'var(--gold)',
                        boxShadow: 'var(--shadow-gold)',
                    }}>
                        <Shield size={24} strokeWidth={1.75} />
                    </div>
                    <h1 className="display-heading" style={{
                        fontSize: '1.875rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem',
                    }}>
                        Welcome Back
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.6,
                    }}>
                        Sign in to access your secure session.
                    </p>
                </div>

                {/* ─ Card ─ */}
                <div className="card anim-fade-up delay-1" style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Email / Username */}
                        <div className="form-group">
                            <label htmlFor="login-email" className="form-label">
                                Email or Username
                            </label>
                            <input
                                id="login-email"
                                name="email"
                                type="text"
                                className="form-input"
                                placeholder="you@university.edu"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="username"
                            />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label htmlFor="login-password" className="form-label">
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="current-password"
                                    style={{ paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        right: '0.875rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '0.25rem',
                                        display: 'flex',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Step indicator */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1.25rem',
                        }}>
                            <div style={{
                                flex: 1,
                                height: '2px',
                                background: 'var(--gold)',
                                borderRadius: '1px',
                            }} />
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.5625rem',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                            }}>Step 1 of 2</span>
                            <div style={{
                                flex: 1,
                                height: '2px',
                                background: 'var(--border-default)',
                                borderRadius: '1px',
                            }} />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="alert alert-error">{error}</div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn btn-gold"
                            disabled={loading}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {loading ? (
                                <><span className="spinner" /> Verifying Credentials…</>
                            ) : (
                                'Sign In → 2FA'
                            )}
                        </button>

                        {/* Footer link */}
                        <p style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                            marginTop: '1.5rem',
                        }}>
                            No account yet?{' '}
                            <Link to="/register" style={{
                                color: 'var(--gold)',
                                fontWeight: 500,
                            }}>
                                Register
                            </Link>
                        </p>
                    </form>
                </div>

                {/* Decorative footer */}
                <hr className="divider-gold" style={{ marginTop: '2rem', opacity: 0.5 }} />
                <p style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.5625rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginTop: '1rem',
                }}>
                    Credentials verified · MFA enforced · RFC 6238
                </p>
            </div>
        </section>
    );
}
