import { Link } from 'react-router-dom';
import { Shield, Smartphone, Mail, KeyRound, ArrowRight, ShieldCheck, Lock, ChevronRight } from 'lucide-react';

const FEATURES = [
    {
        Icon: Smartphone,
        tag: 'Possession Factor',
        title: 'TOTP Authenticator',
        description:
            'Time-based One-Time Passwords via Google Authenticator or Authy. Cryptographically secure per RFC 6238 with a 30-second rotating window.',
    },
    {
        Icon: Mail,
        tag: 'Inherence Factor',
        title: 'Email OTP',
        description:
            'One-time codes delivered to your registered email address. Accessible, universal, and augments password-only authentication with a second channel.',
    },
    {
        Icon: KeyRound,
        tag: 'Possession Factor',
        title: 'SMS Verification',
        description:
            'Real-time SMS codes add a possession-based second factor. Extends coverage to users without dedicated authenticator apps.',
    },
];

const STATS = [
    { value: '81%', label: 'of breaches involve stolen credentials' },
    { value: '99.9%', label: 'of account takeovers blocked by MFA' },
    { value: '3×', label: 'independent verification factors' },
];

export default function LandingPage() {
    return (
        <div>
            {/* ═══ HERO ═══ */}
            <section style={{
                position: 'relative',
                background: 'var(--bg-base)',
                padding: '5.5rem 0 4.5rem',
                overflow: 'hidden',
            }}>
                {/* Dot grid overlay */}
                <div className="dot-grid" style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.55,
                    pointerEvents: 'none',
                }} />

                {/* Gold radial glow — top right */}
                <div style={{
                    position: 'absolute',
                    top: '-15%',
                    right: '8%',
                    width: '560px',
                    height: '560px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(232,184,58,0.07) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />

                {/* Blue glow — bottom left */}
                <div style={{
                    position: 'absolute',
                    bottom: '-10%',
                    left: '-5%',
                    width: '380px',
                    height: '380px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(88,166,255,0.04) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="hero-grid">
                        {/* ─ Left: Text ─ */}
                        <div style={{ maxWidth: '640px' }}>
                            {/* Badge */}
                            <div className="anim-fade-up" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.625rem',
                                background: 'var(--gold-dim)',
                                border: '1px solid var(--gold-border)',
                                borderRadius: '2rem',
                                padding: '0.4375rem 1rem',
                                marginBottom: '1.75rem',
                            }}>
                                <Lock size={11} color="var(--gold)" />
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.625rem',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: 'var(--gold)',
                                }}>
                                    Final Year Cyber Security Research
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="display-heading anim-fade-up delay-1" style={{
                                fontSize: 'clamp(2.5rem, 5vw, 3.875rem)',
                                marginBottom: '1.5rem',
                                color: 'var(--text-primary)',
                            }}>
                                Defend Against{' '}
                                <span style={{ position: 'relative', display: 'inline-block' }}>
                                    <span style={{ color: 'var(--gold)' }}>Credential<br />Stuffing</span>
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '-3px',
                                        left: 0,
                                        width: '100%',
                                        height: '2px',
                                        background: 'linear-gradient(90deg, var(--gold), transparent)',
                                        borderRadius: '1px',
                                    }} />
                                </span>
                                {' '}Attacks
                            </h1>

                            {/* Subtext */}
                            <p className="anim-fade-up delay-2" style={{
                                fontSize: '1.0625rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.8,
                                marginBottom: '2.5rem',
                                maxWidth: '520px',
                            }}>
                                A research platform demonstrating how layered second-factor verification —
                                TOTP, Email OTP, and SMS — closes the security gap left by password-only
                                authentication.
                            </p>

                            {/* CTAs */}
                            <div className="anim-fade-up delay-3" style={{
                                display: 'flex',
                                gap: '0.875rem',
                                flexWrap: 'wrap',
                            }}>
                                <Link to="/register" className="btn btn-gold" style={{ fontSize: '0.9375rem' }}>
                                    Get Started <ArrowRight size={16} />
                                </Link>
                                <Link to="/login" className="btn btn-outline" style={{ fontSize: '0.9375rem' }}>
                                    Sign In <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>

                        {/* ─ Right: Shield Visual ─ */}
                        <div className="hero-visual anim-fade delay-2">
                            <ShieldVisual />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ STATS BAR ═══ */}
            <div style={{
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                padding: '1.75rem 0',
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'clamp(2rem, 6vw, 5rem)',
                    flexWrap: 'wrap',
                }}>
                    {STATS.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.875rem',
                                fontWeight: 700,
                                color: 'var(--gold)',
                                lineHeight: 1,
                                marginBottom: '0.375rem',
                            }}>{s.value}</div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.5625rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--text-muted)',
                                maxWidth: '140px',
                                lineHeight: 1.5,
                            }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ FEATURES ═══ */}
            <section style={{
                background: 'var(--bg-base)',
                padding: '5rem 0',
            }}>
                <div className="container">
                    {/* Section header */}
                    <div style={{ marginBottom: '3rem' }}>
                        <span className="label-caps" style={{ display: 'block', marginBottom: '0.75rem' }}>
                            ◈ Supported MFA Methods
                        </span>
                        <h2 className="display-heading" style={{
                            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                            color: 'var(--text-primary)',
                            marginBottom: '0.875rem',
                        }}>
                            Three Layers of Identity Verification
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '1rem',
                            maxWidth: '500px',
                            lineHeight: 1.75,
                        }}>
                            Each factor independently verifies identity, compounding security and
                            drastically reducing the attack surface for stolen credentials.
                        </p>
                    </div>

                    {/* Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.25rem',
                    }}>
                        {FEATURES.map(({ Icon, tag, title, description }, i) => (
                            <div key={i} className="feature-card">
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.125rem' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius)',
                                        background: 'var(--gold-dim)',
                                        border: '1px solid var(--gold-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--gold)',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={22} strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.5625rem',
                                            letterSpacing: '0.14em',
                                            textTransform: 'uppercase',
                                            color: 'var(--gold)',
                                            display: 'block',
                                            marginBottom: '0.375rem',
                                        }}>{tag}</span>
                                        <h3 style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            marginBottom: '0.625rem',
                                            lineHeight: 1.25,
                                        }}>{title}</h3>
                                        <p style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.75,
                                        }}>{description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section style={{
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
                padding: '5rem 0',
            }}>
                <div className="container" style={{
                    textAlign: 'center',
                    maxWidth: '580px',
                    margin: '0 auto',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'var(--gold-dim)',
                        border: '1px solid var(--gold-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.75rem',
                        color: 'var(--gold)',
                        boxShadow: 'var(--shadow-gold)',
                    }}>
                        <ShieldCheck size={28} strokeWidth={1.5} />
                    </div>
                    <h2 className="display-heading" style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2.125rem)',
                        color: 'var(--text-primary)',
                        marginBottom: '1rem',
                    }}>
                        Ready to Explore Layered Authentication?
                    </h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        lineHeight: 1.75,
                        marginBottom: '2rem',
                    }}>
                        Create a research account and configure your preferred
                        second-factor authentication method.
                    </p>
                    <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-gold">
                            Create Account <ArrowRight size={16} />
                        </Link>
                        <Link to="/login" className="btn btn-outline">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Decorative Shield Visual (hero right side)
   ───────────────────────────────────────────── */
function ShieldVisual() {
    const SIZE = 260;
    const CENTER = SIZE / 2;
    const ORBIT_R = 100;

    const orbitDots = [0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return {
            left: CENTER + ORBIT_R * Math.cos(rad) - 4,
            top:  CENTER + ORBIT_R * Math.sin(rad) - 4,
            isPrimary: deg % 120 === 0,
        };
    });

    return (
        <div style={{
            position: 'relative',
            width: `${SIZE}px`,
            height: `${SIZE}px`,
            flexShrink: 0,
        }}>
            {/* Concentric rings */}
            {[0, 28, 56].map((inset, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    inset: `${inset}px`,
                    borderRadius: '50%',
                    border: `1px solid rgba(232,184,58,${0.18 - i * 0.05})`,
                }} />
            ))}

            {/* Center glow */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 40%, rgba(232,184,58,0.14), rgba(232,184,58,0.03))',
                border: '1px solid var(--gold-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold)',
                boxShadow: '0 0 40px rgba(232,184,58,0.1)',
            }}>
                <Shield size={44} strokeWidth={1.25} />
            </div>

            {/* Orbit dots */}
            {orbitDots.map(({ left, top, isPrimary }, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isPrimary ? 'var(--gold)' : 'var(--border-strong)',
                    opacity: isPrimary ? 0.75 : 0.3,
                }} />
            ))}

            {/* RFC tag */}
            <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--gold-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.375rem 0.625rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
            }}>
                RFC 6238 · TOTP
            </div>
        </div>
    );
}
