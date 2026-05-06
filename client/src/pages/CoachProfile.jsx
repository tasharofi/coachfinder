import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCoachBySlug } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VerifiedCoachBadge, EmailVerifiedBadge } from '../components/VerifiedBadge';
import { formatAvailability } from '../components/AvailabilityPicker';
import ContactRequestModal from '../components/ContactRequestModal';
import ReportModal from '../components/ReportModal';

const SESSION_MODE_LABELS = { IN_PERSON: 'In Person', ONLINE: 'Online', BOTH: 'In Person & Online' };

export default function CoachProfile() {
    const { slug } = useParams();
    const { user } = useAuth();
    const [coach, setCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showContact, setShowContact] = useState(false);
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await getCoachBySlug(slug);
                setCoach(data.coach);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    if (loading) return <div className="loading">Loading coach profile...</div>;
    if (error || !coach) {
        return (
            <div className="empty-state">
                <h2>Coach not found</h2>
                <p>This profile may not exist or hasn't been approved yet.</p>
                <Link to="/search" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Browse Coaches</Link>
            </div>
        );
    }

    const cp = coach.coachProfile;
    const availText = cp ? formatAvailability(cp.availability) : 'Not specified';

    return (
        <div className="coach-profile-page">
            <div className="coach-profile-inner">
                <div className="profile-back-row">
                    <Link to="/search" className="profile-back">← Back to search</Link>
                </div>

                {/* Header */}
                <div className="profile-header">
                    <div className="avatar avatar-lg" style={{ overflow: 'hidden' }}>
                        {coach.avatar ? (
                            <img src={coach.avatar.startsWith('http') ? coach.avatar : coach.avatar} alt={coach.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                            coach.name?.charAt(0)
                        )}
                    </div>
                    <div className="profile-header-info">
                        <h1 className="profile-name">{coach.name}</h1>
                        <div className="coach-card-badges" style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <VerifiedCoachBadge />
                            {coach.emailVerified && <EmailVerifiedBadge />}
                        </div>
                        {cp?.headline && <p className="profile-headline">{cp.headline}</p>}
                    </div>
                </div>

                {/* Quick stats */}
                <div className="profile-stats">
                    {cp?.suburb && (
                        <div className="profile-stat">
                            <span className="profile-stat-label">📍 Location</span>
                            <span className="profile-stat-value">{cp.suburb}, {cp.state}</span>
                        </div>
                    )}
                    {cp?.hourlyRate > 0 && (
                        <div className="profile-stat">
                            <span className="profile-stat-label">💰 Rate</span>
                            <span className="profile-stat-value">${cp.hourlyRate}/hr</span>
                        </div>
                    )}
                    {cp?.sessionMode && (
                        <div className="profile-stat">
                            <span className="profile-stat-label">🎯 Format</span>
                            <span className="profile-stat-value">{SESSION_MODE_LABELS[cp.sessionMode]}</span>
                        </div>
                    )}
                    {cp?.yearsExp > 0 && (
                        <div className="profile-stat">
                            <span className="profile-stat-label">📅 Experience</span>
                            <span className="profile-stat-value">{cp.yearsExp} years</span>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <button className="btn btn-accent btn-lg" onClick={() => setShowContact(true)} style={{ width: '100%', marginBottom: 'var(--space-8)' }} id="profile-contact-btn">
                    Contact {coach.name?.split(' ')[0]}
                </button>

                {/* Skills */}
                {cp?.skills?.length > 0 && (
                    <div className="profile-section">
                        <h2 className="profile-section-title">Skills</h2>
                        <div className="coach-card-skills">
                            {cp.skills.map((s) => (
                                <span key={s.skill?.id || s.id} className="skill-tag">{s.skill?.name || s.name}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* About */}
                {cp?.bio && (
                    <div className="profile-section">
                        <h2 className="profile-section-title">About</h2>
                        <p className="profile-text">{cp.bio}</p>
                    </div>
                )}

                {/* Certifications */}
                {cp?.certifications && (
                    <div className="profile-section">
                        <h2 className="profile-section-title">Certifications & Qualifications</h2>
                        <p className="profile-text">{cp.certifications}</p>
                    </div>
                )}

                {/* Availability */}
                {availText !== 'Not specified' && (
                    <div className="profile-section">
                        <h2 className="profile-section-title">Availability</h2>
                        <p className="profile-text">{availText}</p>
                    </div>
                )}

                {/* Service area */}
                {cp?.serviceRadius && (
                    <div className="profile-section">
                        <h2 className="profile-section-title">Service Area</h2>
                        <p className="profile-text">{cp.serviceRadius}</p>
                    </div>
                )}

                {/* LinkedIn */}
                {cp?.linkedinUrl && (
                    <div className="profile-section">
                        <a href={cp.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                            View LinkedIn profile ↗
                        </a>
                    </div>
                )}

                {/* Report */}
                {user && user.id !== coach.id && (
                    <div className="profile-section" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                        <button
                            className="report-profile-btn"
                            onClick={() => setShowReport(true)}
                            id="report-profile-btn"
                        >
                            🚩 Report this profile
                        </button>
                    </div>
                )}
            </div>

            {showContact && (
                <ContactRequestModal coach={coach} onClose={() => setShowContact(false)} onSent={() => setShowContact(false)} />
            )}

            {showReport && cp && (
                <ReportModal
                    coachProfileId={cp.id}
                    coachName={coach.name}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
}
