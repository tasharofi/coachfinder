import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, googleAuth } from '../services/api';

export default function Login() {
    const navigate = useNavigate();
    const { loginUser } = useAuth();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmailLogin, setShowEmailLogin] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            const data = await googleAuth(credentialResponse.credential, 'learner');
            loginUser(data.user, data.token);
            navigate(redirectTo);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginApi(form);
            loginUser(data.user, data.token);
            navigate(redirectTo);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to manage your profile, search for coaches or respond to session requests.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="auth-google-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign-in failed')}
                        text="signin_with"
                        shape="rectangular"
                        width="100%"
                        theme="outline"
                    />
                </div>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                {showEmailLogin ? (
                    <form className="auth-form" onSubmit={handleEmailLogin}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-email">Email</label>
                            <input id="login-email" className="form-input" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-password">Password</label>
                            <input id="login-password" className="form-input" type="password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                ) : (
                    <button className="btn btn-outline btn-lg" onClick={() => setShowEmailLogin(true)} style={{ width: '100%' }}>
                        Sign in with email
                    </button>
                )}

                <p className="auth-footer">
                    New to Skill Next Door? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    );
}
