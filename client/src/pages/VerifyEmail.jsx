import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail as verifyEmailApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [message, setMessage] = useState('');
    const { refreshUser } = useAuth();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        verifyEmailApi(token)
            .then((data) => {
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
                // Refresh user data to update emailVerified in context
                refreshUser();
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.message || 'Verification failed. The link may be invalid or expired.');
            });
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                {status === 'loading' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
                        <h1 className="auth-title">Verifying your email...</h1>
                        <p className="auth-subtitle">Please wait a moment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                        <h1 className="auth-title">Email Verified!</h1>
                        <p className="auth-subtitle">{message}</p>
                        <p style={{ marginTop: '24px' }}>
                            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
                        <h1 className="auth-title">Verification Failed</h1>
                        <p className="auth-subtitle">{message}</p>
                        <p style={{ marginTop: '24px' }}>
                            <Link to="/dashboard" className="btn btn-outline">Go to Dashboard</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
