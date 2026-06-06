import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillAutocomplete from '../components/SkillAutocomplete';
import SuburbAutocomplete from '../components/SuburbAutocomplete';
import { Trophy, Piano, Guitar, Calculator, Languages, Code2, Camera, Waves } from 'lucide-react';

const POPULAR_SKILLS = [
    { name: 'Tennis', icon: Trophy },
    { name: 'Piano', icon: Piano },
    { name: 'Guitar', icon: Guitar },
    { name: 'Maths', icon: Calculator },
    { name: 'English', icon: Languages },
    { name: 'Coding', icon: Code2 },
    { name: 'Photography', icon: Camera },
    { name: 'Swimming', icon: Waves },
];

export default function Landing() {
    const navigate = useNavigate();
    const [skill, setSkill] = useState('');
    const [suburb, setSuburb] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (skill) params.set('skill', skill);
        if (suburb) params.set('suburb', suburb);
        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="landing-page">
            {/* Hero */}
            <section className="hero">
                <div className="hero-inner">
                    <h1 className="hero-title">Learn from skilled people nearby</h1>
                    <p className="hero-subtitle">
                        Find trusted local coaches and skilled people who can help you learn tennis, piano, maths, coding, photography and more.
                    </p>

                    <form className="hero-search" onSubmit={handleSearch} id="hero-search-form">
                        <div className="hero-search-field" style={{ flex: 1 }}>
                            <label className="hero-search-label">What do you want to learn?</label>
                            <SkillAutocomplete
                                value={skill}
                                onChange={(val) => setSkill(val)}
                                onSelect={(s) => setSkill(s.name)}
                                placeholder="Try tennis, piano, maths"
                                id="hero-skill-input"
                                allowCreate={false}
                            />
                        </div>
                        <div className="hero-search-divider" />
                        <div className="hero-search-field" style={{ flex: 1 }}>
                            <label className="hero-search-label">Where?</label>
                            <SuburbAutocomplete value={suburb} onChange={(s) => setSuburb(s.suburb || s.display || '')} placeholder="Suburb, e.g. Bondi" id="hero-suburb" />
                        </div>
                        <button type="submit" className="btn btn-primary hero-search-btn" id="hero-search-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <span>Search</span>
                        </button>
                    </form>
                    <p className="hero-search-hint">
                        Search by skill and suburb to find people nearby who can help.
                    </p>
                </div>
            </section>

            {/* Popular Skills */}
            <section className="popular-section">
                <h2 className="section-title">Popular skills</h2>
                <div className="popular-grid">
                    {POPULAR_SKILLS.map(({ name: skillName, icon: Icon }) => (
                        <button key={skillName} className="popular-chip" onClick={() => navigate(`/search?skill=${encodeURIComponent(skillName)}`)}>
                            <Icon size={18} strokeWidth={1.75} />
                            <span>{skillName}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Why Skill Next Door? */}
            <section className="why-section">
                <h2 className="section-title">Why learn through Skill Next Door?</h2>
                <div className="why-grid">
                    <div className="why-card">
                        <div className="why-card-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <h3>Local and approachable</h3>
                            <p>Find people nearby who teach the skills you want to learn.</p>
                        </div>
                    </div>
                    <div className="why-card">
                        <div className="why-card-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <h3>Profiles reviewed</h3>
                            <p>Coach profiles are reviewed before they appear publicly.</p>
                        </div>
                    </div>
                    <div className="why-card">
                        <div className="why-card-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        </div>
                        <div>
                            <h3>Flexible sessions</h3>
                            <p>Choose in-person or online sessions based on what works for you.</p>
                        </div>
                    </div>
                    <div className="why-card">
                        <div className="why-card-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        </div>
                        <div>
                            <h3>Compare before you request</h3>
                            <p>Review skills, experience, availability and rates before contacting someone.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="how-section">
                <h2 className="section-title">How it works</h2>
                <div className="how-steps">
                    <div className="how-step">
                        <div className="how-step-number">1</div>
                        <h3>Search nearby</h3>
                        <p>Find people by skill, suburb, session type and availability.</p>
                    </div>
                    <div className="how-step">
                        <div className="how-step-number">2</div>
                        <h3>Review profiles</h3>
                        <p>Check experience, skills, verified status and rates.</p>
                    </div>
                    <div className="how-step">
                        <div className="how-step-number">3</div>
                        <h3>Send a request</h3>
                        <p>Contact the coach through Skill Next Door and organise the session directly.</p>
                    </div>
                </div>
            </section>

            {/* Become a Coach CTA */}
            <section className="btc-cta-section" style={{ marginTop: 0 }}>
                <h2 className="btc-cta-title">Good at something? Teach it locally.</h2>
                <p className="btc-cta-subtitle">
                    Create a profile, get discovered by learners nearby, and earn from the skills you already have.
                </p>
                <button className="btn btn-accent btn-lg" onClick={() => navigate('/become-coach')}>
                    Become a Coach →
                </button>
            </section>
        </div>
    );
}
