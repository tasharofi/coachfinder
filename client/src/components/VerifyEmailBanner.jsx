import { useState } from 'react';
import { resendVerification } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailBanner() {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    // Don't show for: no user, or already verified (Google users are always verified)
    if (!user || user.emailVerified) return null;

    const handleResend = async () => {
        setSending(true);
        setError('');
        try {
            await resendVerification();
            setSent(true);
        } catch (err) {
            setError(err.message || 'Failed to resend');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="verify-email-banner">
            <div className="verify-email-banner-content">
                <span className="verify-email-icon">📧</span>
                <div className="verify-email-text">
                    <strong>Please verify your email to unlock all features.</strong>
                    {sent ? (
                        <span className="verify-email-sent"> Verification email sent — check your inbox!</span>
                    ) : (
                        <>
                            <span> Check your inbox or </span>
                            <button
                                className="verify-email-resend"
                                onClick={handleResend}
                                disabled={sending}
                            >
                                {sending ? 'Sending...' : 'resend verification email'}
                            </button>
                        </>
                    )}
                    {error && <span className="verify-email-error"> {error}</span>}
                </div>
            </div>
        </div>
    );
}
