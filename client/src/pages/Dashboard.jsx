import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyContactRequests, getCoachStatus } from '../services/api';
import VerifyEmailBanner from '../components/VerifyEmailBanner';

const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', className: 'draft', message: 'Your coach application is saved as a draft. Complete and submit it to be reviewed.' },
    PENDING: { label: 'Under Review', className: 'pending', message: 'Your coach profile is under review and is not live yet. We will notify you by email once it is approved.' },
    APPROVED: { label: 'Live', className: 'approved', message: 'Your coach profile is live and visible to learners.' },
    REJECTED: { label: 'Not Approved', className: 'rejected', message: 'Your coach application was not approved. You can update and resubmit.' },
    SUSPENDED: { label: 'Suspended', className: 'suspended', message: 'Your coach profile has been suspended. Contact support for more information.' },
};

export default function Dashboard() {
    const { user, isCoach, isLearner, coachStatus } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState(isCoach ? 'coach' : 'learner');
    const [coachRequests, setCoachRequests] = useState([]);
    const [learnerRequests, setLearnerRequests] = useState([]);
    const [coachProfile, setCoachProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const loadData = async () => {
            setLoading(true);
            try {
                const promises = [
                    // Always fetch learner-sent requests
                    getMyContactRequests('learner').catch(() => ({ contactRequests: [] })),
                    // Fetch coach status if applicable
                    isCoach ? getCoachStatus().catch(() => ({ hasProfile: false })) : Promise.resolve({ hasProfile: false }),
                ];
                // If user is a coach, also fetch coach-received requests
                if (isCoach) {
                    promises.push(getMyContactRequests('coach').catch(() => ({ contactRequests: [] })));
                }

                const results = await Promise.all(promises);
                setLearnerRequests(results[0].contactRequests || []);
                if (results[1].hasProfile) setCoachProfile(results[1].profile);
                if (isCoach && results[2]) {
                    setCoachRequests(results[2].contactRequests || []);
                }
            } catch {}
            finally { setLoading(false); }
        };
        loadData();
    }, [user, isCoach, navigate]);

    if (!user) return null;

    const statusInfo = STATUS_CONFIG[coachStatus] || null;

    return (
        <div className="dashboard">
            <VerifyEmailBanner />
            <div className="dashboard-header">
                <div className="dashboard-header-row">
                    <div>
                        <h1 className="dashboard-title">Welcome, {user.name}</h1>
                        <p className="dashboard-subtitle">{user.email}</p>
                    </div>
                    {!isCoach && (
                        <Link to="/become-coach" className="btn btn-accent btn-sm">Become a Coach</Link>
                    )}
                </div>
            </div>

            {/* Tabs for dual-role users */}
            {isCoach && isLearner && (
                <div className="tabs">
                    <button className={`tab ${tab === 'coach' ? 'active' : ''}`} onClick={() => setTab('coach')}>Coach</button>
                    <button className={`tab ${tab === 'learner' ? 'active' : ''}`} onClick={() => setTab('learner')}>Learner</button>
                </div>
            )}

            {loading ? (
                <div className="loading">Loading dashboard...</div>
            ) : tab === 'coach' && isCoach ? (
                <CoachDashboard statusInfo={statusInfo} coachStatus={coachStatus} coachProfile={coachProfile} contactRequests={coachRequests} user={user} />
            ) : (
                <LearnerDashboard contactRequests={learnerRequests} isCoach={isCoach} />
            )}
        </div>
    );
}

function CoachDashboard({ statusInfo, coachStatus, coachProfile, contactRequests, user }) {
    const myRequests = contactRequests;

    return (
        <>
            {/* Status Banner */}
            {statusInfo && (
                <div className={`coach-status-banner ${statusInfo.className}`}>
                    <div className="coach-status-label">{statusInfo.label}</div>
                    <p>{statusInfo.message}</p>
                    {(coachStatus === 'DRAFT' || coachStatus === 'REJECTED') && (
                        <Link to="/apply-coach" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                            {coachStatus === 'DRAFT' ? 'Complete Application' : 'Update & Resubmit'}
                        </Link>
                    )}
                    {coachStatus === 'APPROVED' && user?.slug && (
                        <Link to={`/coach/${user.slug}`} className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                            View My Profile
                        </Link>
                    )}
                </div>
            )}

            {/* Coach Stats */}
            {coachStatus === 'APPROVED' && (
                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-value">{myRequests.length}</div>
                        <div className="stat-label">Total Requests</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">
                            {myRequests.filter(r => r.status === 'NEW').length}
                        </div>
                        <div className="stat-label">New Requests</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">${coachProfile?.hourlyRate || 0}</div>
                        <div className="stat-label">Hourly Rate</div>
                    </div>
                </div>
            )}

            {/* Skills Summary */}
            {coachStatus === 'APPROVED' && coachProfile?.skills?.length > 0 && (
                <div className="dashboard-card" style={{ marginTop: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>Your Skills</h3>
                    <div className="coach-card-skills">
                        {coachProfile.skills.map(s => (
                            <span key={s.skill?.id || s.id} className="skill-tag">{s.skill?.name || s.name}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact Requests (for approved coaches) */}
            {coachStatus === 'APPROVED' && (
                <div className="dashboard-card" style={{ marginTop: 'var(--space-4)' }}>
                    <h2 className="dashboard-card-title">Booking Requests</h2>
                    {myRequests.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                            <div className="empty-state-icon">📬</div>
                            <p>No booking requests yet. Your profile is live — requests will appear here.</p>
                        </div>
                    ) : (
                        <div className="sessions-list">
                            {myRequests.map((req) => (
                                <div key={req.id} className="session-card">
                                    <div className="session-card-top">
                                        <div className="session-card-info">
                                            <div className="session-card-person">
                                                <div className="avatar avatar-sm">{req.learnerName?.charAt(0)}</div>
                                                <div>
                                                    <div className="session-card-name">{req.learnerName}</div>
                                                    <div className="session-card-date">{req.learnerEmail}</div>
                                                </div>
                                            </div>
                                            <span className={`session-status ${req.status?.toLowerCase()}`}>{req.status}</span>
                                        </div>
                                    </div>
                                    {req.message && <div className="session-card-notes">{req.message}</div>}
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', paddingLeft: 'calc(32px + var(--space-3))' }}>
                                        {new Date(req.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {req.preferredMode && req.preferredMode !== 'EITHER' && ` · ${req.preferredMode === 'IN_PERSON' ? 'In Person' : 'Online'}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

function LearnerDashboard({ contactRequests, isCoach }) {
    return (
        <>
            {!isCoach && (
                <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)', background: 'var(--color-bg-secondary)' }}>
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>🎓 Want to teach your skills?</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                        Share your expertise and earn extra income by becoming a coach on our platform.
                    </p>
                    <Link to="/become-coach" className="btn btn-accent btn-sm">Become a Coach →</Link>
                </div>
            )}

            <div className="dashboard-card">
                <h2 className="dashboard-card-title">My Requests</h2>
                {contactRequests.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                        <div className="empty-state-icon">📋</div>
                        <p>You haven't sent any booking requests yet.</p>
                        <Link to="/search" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>Find a Coach</Link>
                    </div>
                ) : (
                    <div className="sessions-list">
                        {contactRequests.map((req) => (
                            <div key={req.id} className="session-card">
                                <div className="session-card-top">
                                    <div className="session-card-info">
                                        <div className="session-card-person">
                                            <div className="avatar avatar-sm">{req.coachProfile?.user?.name?.charAt(0) || '?'}</div>
                                            <div>
                                                <div className="session-card-name">
                                                    {req.coachProfile?.user?.slug ? (
                                                        <Link to={`/coach/${req.coachProfile.user.slug}`}>{req.coachProfile.user.name}</Link>
                                                    ) : (req.coachProfile?.user?.name || 'Coach')}
                                                </div>
                                                <div className="session-card-date">
                                                    {new Date(req.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`session-status ${req.status?.toLowerCase()}`}>{req.status === 'NEW' ? 'Sent' : req.status}</span>
                                    </div>
                                </div>
                                {req.message && <div className="session-card-notes">{req.message}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
