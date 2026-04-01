import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PUBLIC_NAV_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Register' },
];

const AUTH_NAV_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, doLogout } = useAuth();

    const navLinks = user ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS;

    const handleLogout = async () => {
        setMobileOpen(false);
        await doLogout();
        navigate('/login');
    };

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'rgba(9, 12, 17, 0.9)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderBottom: '1px solid var(--border-subtle)',
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '3.75rem',
            }}>
                {/* ─ Brand ─ */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--gold-dim)',
                        border: '1px solid var(--gold-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold)',
                        flexShrink: 0,
                    }}>
                        <Shield size={16} strokeWidth={2} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: '2px' }}>
                        <span style={{
                            fontFamily: 'var(--font-body)',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            color: 'var(--text-primary)',
                            letterSpacing: '0.01em',
                        }}>SecureAuth</span>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.5rem',
                            color: 'var(--gold)',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}>2FA Platform</span>
                    </div>
                </Link>

                {/* ─ Desktop Nav ─ */}
                <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0.125rem' }}>
                    {navLinks.map(link => {
                        const active = location.pathname === link.to;
                        return (
                            <Link key={link.to} to={link.to} style={{
                                padding: '0.4375rem 0.875rem',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: active ? 'var(--gold)' : 'var(--text-secondary)',
                                background: active ? 'var(--gold-dim)' : 'transparent',
                                border: active ? '1px solid var(--gold-border)' : '1px solid transparent',
                                transition: 'all 0.15s ease',
                            }}>
                                {link.label}
                            </Link>
                        );
                    })}
                    <div style={{
                        width: '1px',
                        height: '18px',
                        background: 'var(--border-default)',
                        margin: '0 0.625rem',
                    }} />
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem 1.125rem', fontSize: '0.8125rem', gap: '0.375rem' }}
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    ) : (
                        <Link to="/register" className="btn btn-gold" style={{
                            padding: '0.5rem 1.125rem',
                            fontSize: '0.8125rem',
                        }}>
                            Get Started
                        </Link>
                    )}
                </div>

                {/* ─ Mobile Toggle ─ */}
                <button
                    onClick={() => setMobileOpen(p => !p)}
                    className="md:hidden"
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        padding: '0.4375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {/* ─ Mobile Menu ─ */}
            {mobileOpen && (
                <div className="md:hidden" style={{
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                }}>
                    {navLinks.map(link => {
                        const active = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: active ? 'var(--gold)' : 'var(--text-secondary)',
                                    background: active ? 'var(--gold-dim)' : 'transparent',
                                }}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                    {user && (
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.75rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}
