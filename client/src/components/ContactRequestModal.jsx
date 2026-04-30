import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { submitContactRequest } from '../services/api';
import SuburbAutocomplete from './SuburbAutocomplete';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['Morning', 'Afternoon', 'Evening'];

export default function ContactRequestModal({ coach, onClose, onSent }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        learnerName: user?.name || '',
        learnerEmail: user?.email || '',
        learnerPhone: '',
        preferredMode: 'EITHER',
        preferredDays: [],
        preferredTimes: [],
        message: '',
        preferredSuburb: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!user) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">Sign in required</h2>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body">
                        <p style={{ marginBottom: 'var(--space-4)' }}>You need to sign in to contact a coach.</p>
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')} style={{ width: '100%' }}>
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const toggleDay = (day) => {
        setForm(prev => ({
            ...prev,
            preferredDays: prev.preferredDays.includes(day)
                ? prev.preferredDays.filter(d => d !== day)
                : [...prev.preferredDays, day],
        }));
    };

    const toggleTime = (time) => {
        setForm(prev => ({
            ...prev,
            preferredTimes: prev.preferredTimes.includes(time)
                ? prev.preferredTimes.filter(t => t !== time)
                : [...prev.preferredTimes, time],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.learnerName || !form.learnerEmail || !form.message) {
            setError('Please fill in your name, email, and message.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await submitContactRequest({
                coachProfileId: coach.coachProfile?.id || coach.id,
                learnerName: form.learnerName,
                learnerEmail: form.learnerEmail,
                learnerPhone: form.learnerPhone || undefined,
                preferredMode: form.preferredMode,
                preferredDays: JSON.stringify(form.preferredDays),
                preferredTimes: JSON.stringify(form.preferredTimes),
                message: form.message,
                preferredSuburb: form.preferredSuburb || undefined,
            });
            setSuccess(true);
            setTimeout(() => {
                if (onSent) onSent();
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const coachName = coach.name || coach.user?.name || 'Coach';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {success ? 'Request Sent!' : `Contact ${coachName}`}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {success ? (
                        <div className="booking-success">
                            <div className="booking-success-icon">✉️</div>
                            <p>Your request has been sent to {coachName}.</p>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                                The coach will respond via email. Your email stays private until you choose to share it.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="booking-form">
                            {error && <div className="alert alert-error">{error}</div>}

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" htmlFor="cr-name">Your name *</label>
                                    <input id="cr-name" className="form-input" value={form.learnerName} onChange={(e) => setForm({ ...form, learnerName: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" htmlFor="cr-email">Your email *</label>
                                    <input id="cr-email" className="form-input" type="email" value={form.learnerEmail} onChange={(e) => setForm({ ...form, learnerEmail: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="cr-phone">Phone (optional)</label>
                                <input id="cr-phone" className="form-input" type="tel" value={form.learnerPhone} onChange={(e) => setForm({ ...form, learnerPhone: e.target.value })} placeholder="04xx xxx xxx" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Preferred session type</label>
                                <div className="form-toggle" style={{ maxWidth: '100%' }}>
                                    {['IN_PERSON', 'ONLINE', 'EITHER'].map(mode => (
                                        <button key={mode} type="button" className={`form-toggle-option ${form.preferredMode === mode ? 'active' : ''}`} onClick={() => setForm({ ...form, preferredMode: mode })}>
                                            {mode === 'IN_PERSON' ? 'In Person' : mode === 'ONLINE' ? 'Online' : 'Either'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Preferred day(s)</label>
                                <div className="chip-group">
                                    {DAYS.map(day => (
                                        <button key={day} type="button" className={`chip ${form.preferredDays.includes(day) ? 'active' : ''}`} onClick={() => toggleDay(day)}>
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Preferred time(s)</label>
                                <div className="chip-group">
                                    {TIMES.map(time => (
                                        <button key={time} type="button" className={`chip ${form.preferredTimes.includes(time) ? 'active' : ''}`} onClick={() => toggleTime(time)}>
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="cr-message">Message / Learning goal *</label>
                                <textarea id="cr-message" className="form-input form-textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What would you like to learn? Any specific goals?" rows={3} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Preferred suburb (optional)</label>
                                <SuburbAutocomplete value={form.preferredSuburb} onChange={(s) => setForm({ ...form, preferredSuburb: s.display || '' })} placeholder="Where would you prefer?" id="cr-suburb" />
                            </div>

                            <button type="submit" className="btn btn-accent btn-lg" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Sending...' : 'Send Request'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
