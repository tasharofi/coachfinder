import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../services/api';

const REASONS = [
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'misleading', label: 'Misleading information' },
    { value: 'spam', label: 'Spam / scam' },
    { value: 'offensive_image', label: 'Offensive image' },
    { value: 'wrong_skill', label: 'Wrong skill / category' },
];

export default function ReportModal({ coachProfileId, coachName, onClose }) {
    const { user } = useAuth();
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            setError('Please select a reason.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await submitReport({ coachProfileId, reason, details });
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                {success ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>✓</div>
                        <h2 className="auth-title">Report Submitted</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)' }}>
                            Thank you. Our team will review your report about {coachName}.
                        </p>
                        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 'var(--space-6)', width: '100%' }}>
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="modal-header">
                            <h2 className="modal-title">Report Profile</h2>
                            <button className="modal-close" onClick={onClose}>✕</button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                            Report {coachName}'s profile if you believe it violates our guidelines.
                        </p>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Reason *</label>
                                {REASONS.map(r => (
                                    <label key={r.value} className="report-reason-option">
                                        <input
                                            type="radio" name="reason"
                                            value={r.value}
                                            checked={reason === r.value}
                                            onChange={() => setReason(r.value)}
                                        />
                                        <span>{r.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="report-details">Additional details (optional)</label>
                                <textarea
                                    id="report-details"
                                    className="form-input form-textarea"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Provide any additional context..."
                                    rows={3}
                                    maxLength={1000}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
