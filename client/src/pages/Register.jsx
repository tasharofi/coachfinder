import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { googleAuth, register as registerApi } from '../services/api';
import { BookOpenCheck, Sparkles } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const { loginUser } = useAuth();
    const [searchParams] = useSearchParams();
    const initialIntent = searchParams.get('intent') || '';
    const [intent, setIntent] = useState(initialIntent);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            const data = await googleAuth(credentialResponse.credential, intent || 'learner');
            loginUser(data.user, data.token);
            if (intent === 'coach') {
                navigate('/apply-coach');
            } else {
                navigate('/search');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await registerApi({ ...form, intent: intent || 'learner' });
            loginUser(data.user, data.token);
            // Show brief notice, then navigate
            if (intent === 'coach') {
                navigate('/apply-coach');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Choose path
    if (!intent) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ maxWidth: '520px' }}>
                    <h1 className="auth-title">Join Skill Next Door</h1>
                    <p className="auth-subtitle">Create an account to learn from skilled people nearby or share what you know as a coach.</p>

                    <div className="register-paths">
                        <button className="register-path-card" onClick={() => setIntent('learner')}>
                            <div className="register-path-icon"><BookOpenCheck size={44} strokeWidth={1.75} /></div>
                            <div className="register-path-title">I want to learn</div>
                            <div className="register-path-desc">Search for local coaches, view profiles and send session requests.</div>
                        </button>
                        <button className="register-path-card" onClick={() => setIntent('coach')}>
                            <div className="register-path-icon"><Sparkles size={44} strokeWidth={1.75} /></div>
                            <div className="register-path-title">I want to teach</div>
                            <div className="register-path-desc">Create a profile, share your skills and receive requests from learners nearby.</div>
                        </button>
                    </div>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        );
    }

    // Step 2: Sign up
    return (
        <div className="auth-page">
            <div className="auth-card">
                <button className="profile-back" onClick={() => { setIntent(''); setShowEmailForm(false); setError(''); }}>
                    ← Back
                </button>
                <h1 className="auth-title">
                    {intent === 'coach' ? 'Apply as Coach' : 'Join as Learner'}
                </h1>
                <p className="auth-subtitle">
                    {intent === 'coach'
                        ? 'Create your account, then set up your coach profile. Profiles are reviewed before going live.'
                        : 'Create your account and start searching for coaches nearby'}
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="auth-google-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign-in failed')}
                        text="signup_with"
                        shape="rectangular"
                        width="100%"
                        theme="outline"
                    />
                </div>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                {showEmailForm ? (
                    <form className="auth-form" onSubmit={handleEmailRegister}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-name">Full name</label>
                            <input id="reg-name" className="form-input" type="text" placeholder="John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-email">Email</label>
                            <input id="reg-email" className="form-input" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password">Password</label>
                            <input id="reg-password" className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                ) : (
                    <button className="btn btn-outline btn-lg" onClick={() => setShowEmailForm(true)} style={{ width: '100%' }}>
                        Register with email
                    </button>
                )}

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
