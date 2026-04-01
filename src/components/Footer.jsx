import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Register' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/reset-password', label: 'Reset Password' },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '2.5rem 0',
        }}>
            <div className="container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                textAlign: 'center',
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'var(--gold-dim)',
                        border: '1px solid var(--gold-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold)',
                    }}>
                        <Shield size={14} strokeWidth={2} />
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'var(--text-primary)',
                    }}>SecureAuth 2FA</span>
                </div>

                {/* Description */}
                <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    maxWidth: '440px',
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-body)',
                }}>
                    A final-year Cyber Security research project demonstrating multi-layered
                    authentication to mitigate credential-based attacks.
                </p>

                {/* Links */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {FOOTER_LINKS.map(link => (
                        <Link key={link.to} to={link.to} style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.5625rem',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            transition: 'color 0.15s ease',
                        }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <hr className="divider-gold" style={{ width: '100px' }} />

                <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.5625rem',
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                }}>
                    © {year} SecureAuth — Academic Use Only
                </p>
            </div>
        </footer>
    );
}
