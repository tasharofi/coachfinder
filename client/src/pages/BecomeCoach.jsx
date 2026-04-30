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
                    <h1 className="btc-hero-title">Earn money teaching what you love</h1>
                    <p className="btc-hero-subtitle">
                        Share your skills, set your own schedule, and connect with learners in your area.
                        Whether you teach tennis, piano, coding, or yoga — CoachFinder helps you get discovered.
                    </p>
                    <button className="btn btn-accent btn-lg" onClick={handleCTA} id="btc-hero-cta">
                        Start Coaching →
                    </button>
                </div>
            </section>

            {/* Why become a coach */}
            <section className="btc-section">
                <h2 className="btc-section-title">Why become a coach?</h2>
                <div className="btc-benefits">
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">🕐</div>
                        <h3>Flexible schedule</h3>
                        <p>Coach when it suits you. Set your own availability — mornings, evenings, or weekends.</p>
                    </div>
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">💰</div>
                        <h3>Earn extra income</h3>
                        <p>Set your own rates and get paid for sharing your expertise. You control your earnings.</p>
                    </div>
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">🌐</div>
                        <h3>Teach online or locally</h3>
                        <p>Offer sessions in person, online, or both. Reach learners wherever they are.</p>
                    </div>
                    <div className="btc-benefit">
                        <div className="btc-benefit-icon">⭐</div>
                        <h3>Build your reputation</h3>
                        <p>Create a professional profile, get verified, and grow your coaching presence.</p>
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
                        <p>Tell us about your skills, experience, location, and availability. Upload a photo and write a compelling bio.</p>
                    </div>
                    <div className="btc-step">
                        <div className="btc-step-number">2</div>
                        <h3>Get approved</h3>
                        <p>Our team reviews your application to ensure quality. Approved coaches get a Verified badge on their profile.</p>
                    </div>
                    <div className="btc-step">
                        <div className="btc-step-number">3</div>
                        <h3>Get discovered</h3>
                        <p>Your profile goes live on CoachFinder. Learners in your area can find you through search.</p>
                    </div>
                    <div className="btc-step">
                        <div className="btc-step-number">4</div>
                        <h3>Receive requests</h3>
                        <p>When a learner is interested, they send you a booking request. You receive an email and decide how to respond.</p>
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="btc-section">
                <h2 className="btc-section-title">Trust & visibility</h2>
                <div className="btc-trust">
                    <div className="btc-trust-item">
                        <span className="btc-trust-badge">🛡️ Verified Coach</span>
                        <p>Approved coaches receive a visible verified badge, building trust with learners.</p>
                    </div>
                    <div className="btc-trust-item">
                        <span className="btc-trust-badge">📧 Email Verified</span>
                        <p>Your email is verified through Google sign-in, adding an extra layer of credibility.</p>
                    </div>
                    <div className="btc-trust-item">
                        <span className="btc-trust-badge">🔒 Privacy Protected</span>
                        <p>Your personal email is never shown to learners. All requests come through the platform.</p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="btc-cta-section">
                <h2 className="btc-cta-title">Ready to start coaching?</h2>
                <p className="btc-cta-subtitle">
                    It only takes a few minutes to create your profile. Join coaches already earning on CoachFinder.
                </p>
                <button className="btn btn-accent btn-lg" onClick={handleCTA} id="btc-final-cta">
                    Apply as Coach →
                </button>
            </section>
        </div>
    );
}
