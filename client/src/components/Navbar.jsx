import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, loading, logout, isAdmin, isCoach, coachStatus } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    return (
        <nav className="nav">
            <div className="nav-inner">
                <Link to="/" className="nav-logo">CoachFinder</Link>

                <div className="nav-actions">
                    {loading ? null : user ? (
                        <>
                            {isAdmin && (
                                <Link to="/admin" className="btn btn-sm" style={{ color: 'var(--color-text-secondary)' }}>Admin</Link>
                            )}
                            <Link to="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>
                            <Link to="/profile" className="btn btn-sm" style={{ color: 'var(--color-text-secondary)' }}>Profile</Link>
                            <button onClick={handleLogout} className="btn btn-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/become-coach" className="btn btn-accent btn-sm">Become a Coach</Link>
                            <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                        </>
                    )}
                </div>

                <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            <div className={`nav-mobile-menu ${menuOpen ? 'open' : ''}`}>
                {loading ? null : user ? (
                    <>
                        {isAdmin && (
                            <Link to="/admin" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                        )}
                        <Link to="/dashboard" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                        <Link to="/profile" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Profile</Link>
                        <button className="nav-mobile-link" onClick={handleLogout} style={{ textAlign: 'left' }}>Sign Out</button>
                    </>
                ) : (
                    <>
                        <Link to="/become-coach" className="nav-mobile-link nav-mobile-accent" onClick={() => setMenuOpen(false)}>Become a Coach</Link>
                        <Link to="/login" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
                        <Link to="/register" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

