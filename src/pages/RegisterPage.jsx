import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { register as apiRegister } from '../utils/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = e => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await apiRegister({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.message || 'Registration failed. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const passwordMismatch =
        formData.confirmPassword && formData.password !== formData.confirmPassword;

    return (
        <section style={{
            minHeight: 'calc(100vh - 3.75rem)',
            background: 'var(--bg-base)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '3.5rem 1.5rem 4rem',
        }}>
            {/* Background dot grid */}
            <div className="dot-grid" style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.4,
                pointerEvents: 'none',
            }} />

            {/* Content wrapper */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '480px',
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
                        <ShieldCheck size={24} strokeWidth={1.75} />
                    </div>
                    <h1 className="display-heading" style={{
                        fontSize: '1.875rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem',
                    }}>
                        Create Account
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.6,
                    }}>
                        Register to enable multi-factor authentication.
                    </p>
                </div>

                {/* ─ Card ─ */}
                <div className="card anim-fade-up delay-1" style={{ padding: '2rem' }}>
                    {success ? (
                        /* ─ Success State ─ */
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(63, 185, 80, 0.1)',
                                border: '1px solid rgba(63, 185, 80, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.25rem',
                                color: 'var(--success)',
                            }}>
                                <CheckCircle size={30} strokeWidth={1.75} />
                            </div>
                            <h2 className="display-heading" style={{
                                fontSize: '1.5rem',
                                color: 'var(--text-primary)',
                                marginBottom: '0.625rem',
                            }}>
                                Registration Successful
                            </h2>
                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9375rem',
                                lineHeight: 1.7,
                                marginBottom: '1.75rem',
                            }}>
                                Your account has been created. Proceed to login to configure your 2FA method.
                            </p>
                            <Link to="/login" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                                Go to Login <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        /* ─ Form ─ */
                        <form onSubmit={handleSubmit} noValidate>
                            {/* Username */}
                            <div className="form-group">
                                <label htmlFor="username" className="form-label">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. johndoe"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="you@university.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Min. 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
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
                                <PasswordStrengthMeter password={formData.password} />
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirm ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Re-enter your password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        style={{
                                            paddingRight: '3rem',
                                            borderColor: passwordMismatch
                                                ? 'rgba(248,81,73,0.5)'
                                                : undefined,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(p => !p)}
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
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
                                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {passwordMismatch && (
                                    <p style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.625rem',
                                        letterSpacing: '0.08em',
                                        color: 'var(--danger)',
                                        marginTop: '0.25rem',
                                    }}>
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn btn-gold"
                                disabled={loading}
                                style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                            >
                                {loading ? (
                                    <><span className="spinner" /> Creating Account…</>
                                ) : (
                                    'Create Account'
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
                                Already have an account?{' '}
                                <Link to="/login" style={{
                                    color: 'var(--gold)',
                                    fontWeight: 500,
                                    transition: 'color 0.15s ease',
                                }}>
                                    Sign In
                                </Link>
                            </p>
                        </form>
                    )}
                </div>

                {/* Decorative rule */}
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
                    Secure · Research Platform · Academic Use
                </p>
            </div>
        </section>
    );
}
