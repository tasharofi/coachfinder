import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BecomeCoach() {
    const navigate = useNavigate();
    const { user, isCoach, coachStatus } = useAuth();

    const handleCTA = () => {
        if (user) {
            if (isCoach && coachStatus === 'APPROVED') {
                navigate('/dashboard');
            } else {
                navigate('/apply-coach');
            }
        } else {
            navigate('/register?intent=coach');
        }
    };

    return (
        <div className="btc-page">
            {/* Hero */}
            <section className="btc-hero">
                <div className="btc-hero-inner">
                    <h1 className="btc-hero-title">Good at something?<br />Start coaching it.</h1>
                    <p className="btc-hero-subtitle">
                        Whether you play tennis, teach piano, code, cook or speak another language, CoachFinder helps you create a profile, get discovered locally, and receive coaching requests.
                    </p>
                    <button className="btn btn-accent btn-lg btc-hero-btn" onClick={handleCTA} id="btc-hero-cta">
                        Start Coaching →
                    </button>
                </div>
            </section>

            {/* Why become a coach */}
            <section className="btc-section">
                <h2 className="btc-section-title">Why become a coach?</h2>
                <div className="btc-benefits">
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <div>
                            <h3>Earn from your skills</h3>
                            <p>Set your own rate and turn your experience into extra income.</p>
                        </div>
                    </div>
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <h3>Coach on your terms</h3>
                            <p>Choose when you're available and whether you teach online, in person, or both.</p>
                        </div>
                    </div>
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div>
                            <h3>Get discovered locally</h3>
                            <p>Learners in your area can find your profile when they search for your skill.</p>
                        </div>
                    </div>
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <h3>Build trust over time</h3>
                            <p>Create a verified profile and grow your reputation as learners connect with you.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="btc-section btc-section-alt">
                <h2 className="btc-section-title">How it works</h2>
                <div className="btc-steps">
                    <div className="btc-step">
                        <div className="btc-step-number">1</div>
                        <h3>Create your profile</h3>
                        <p>Tell learners what you teach, where you coach, your availability and your experience.</p>
                    </div>
                    <div className="btc-step">
                        <div className="btc-step-number">2</div>
                        <h3>Get reviewed</h3>
                        <p>We review coach profiles before they appear publicly to help keep the platform trusted.</p>
                    </div>
                    <div className="btc-step">
                        <div className="btc-step-number">3</div>
                        <h3>Get discovered</h3>
                        <p>Once approved, learners can find your profile by skill and suburb.</p>
                    </div>
                    <div className="btc-step">
                        <div className="btc-step-number">4</div>
                        <h3>Receive requests</h3>
                        <p>Interested learners send you a request. You decide how and when to respond.</p>
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="btc-section">
                <h2 className="btc-section-title">Trust & visibility</h2>
                <div className="btc-trust">
                    <div className="btc-trust-item">
                        <div className="btc-trust-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <span className="btc-trust-badge">Verified coach profile</span>
                            <p>Approved coaches receive a visible badge so learners know the profile has been reviewed.</p>
                        </div>
                    </div>
                    <div className="btc-trust-item">
                        <div className="btc-trust-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </div>
                        <div>
                            <span className="btc-trust-badge">Email verified</span>
                            <p>Google sign-in helps confirm your email and adds trust to your profile.</p>
                        </div>
                    </div>
                    <div className="btc-trust-item">
                        <div className="btc-trust-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <div>
                            <span className="btc-trust-badge">Your contact details stay private</span>
                            <p>Learners send requests through CoachFinder, so your personal email is not shown publicly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="btc-cta-section">
                <h2 className="btc-cta-title">Ready to share what you know?</h2>
                <p className="btc-cta-subtitle">
                    Create your coach profile and start getting discovered by learners nearby.
                </p>
                <button className="btn btn-accent btn-lg" onClick={handleCTA} id="btc-final-cta">
                    Apply as Coach →
                </button>
            </section>
        </div>
    );
}
