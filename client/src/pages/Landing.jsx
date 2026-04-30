import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillAutocomplete from '../components/SkillAutocomplete';
import SuburbAutocomplete from '../components/SuburbAutocomplete';
import { parseSearchQuery } from '../services/api';

const POPULAR_SKILLS = ['Tennis', 'Piano', 'Guitar', 'Maths', 'English', 'Coding', 'Yoga', 'Swimming'];

// Detect if query looks like a natural-language phrase vs. simple keyword
function isNaturalLanguageQuery(text) {
    const words = text.trim().split(/\s+/);
    if (words.length <= 3) return false;
    const nlIndicators = /\b(looking for|find me|need|want|near|in|around|beginner|advanced|for my|for kids|lessons|coach|tutor|online|affordable|cheap|premium)\b/i;
    return nlIndicators.test(text);
}

export default function Landing() {
    const navigate = useNavigate();
    const [skill, setSkill] = useState('');
    const [suburb, setSuburb] = useState('');
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();

        const params = new URLSearchParams();

        // If input looks like natural language, try AI parsing first
        if (skill && isNaturalLanguageQuery(skill)) {
            setSearching(true);
            try {
                const result = await parseSearchQuery(skill);
                if (result.parsed) {
                    if (result.skillQuery) params.set('skill', result.skillQuery);
                    if (result.locationQuery) params.set('suburb', result.locationQuery);
                    if (result.sessionMode) params.set('sessionMode', result.sessionMode);
                    if (result.availability) params.set('availability', result.availability);
                    params.set('aiParsed', '1');
                    navigate(`/search?${params.toString()}`);
                    return;
                }
            } catch {
                // AI failed — fall through to normal search
            } finally {
                setSearching(false);
            }
        }

        // Normal search flow
        if (skill) params.set('skill', skill);
        if (suburb) params.set('suburb', suburb);
        navigate(`/search?${params.toString()}`);
    };

    return (
        <div>
            {/* Hero */}
            <section className="hero">
                <h1 className="hero-title">Find your perfect coach</h1>
                <p className="hero-subtitle">
                    Connect with expert coaches in your area. Tennis, piano, coding, yoga, and more.
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
                        />
                    </div>
                    <div className="hero-search-divider" />
                    <div className="hero-search-field" style={{ flex: 1 }}>
                        <label className="hero-search-label">Where?</label>
                        <SuburbAutocomplete value={suburb} onChange={(s) => setSuburb(s.suburb || s.display || '')} placeholder="Suburb, e.g. Bondi" id="hero-suburb" />
                    </div>
                    <button type="submit" className="btn btn-primary hero-search-btn" id="hero-search-btn" disabled={searching}>
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </form>
                <p className="hero-search-hint">
                    Try phrases like "piano coach in Berowra" or "online maths tutor".
                </p>
            </section>

            {/* Popular Skills */}
            <section className="popular-section">
                <h2 className="section-title">Popular skills</h2>
                <div className="popular-grid">
                    {POPULAR_SKILLS.map(skillName => (
                        <button key={skillName} className="popular-card" onClick={() => navigate(`/search?skill=${encodeURIComponent(skillName)}`)}>
                            <span className="popular-card-name">{skillName}</span>
                            <span className="popular-card-arrow">→</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="how-section">
                <h2 className="section-title">How it works</h2>
                <div className="how-steps">
                    <div className="how-step">
                        <div className="how-step-number">1</div>
                        <h3>Search</h3>
                        <p>Browse coaches by skill, location, and availability.</p>
                    </div>
                    <div className="how-step">
                        <div className="how-step-number">2</div>
                        <h3>Compare</h3>
                        <p>View profiles, check credentials, and compare rates.</p>
                    </div>
                    <div className="how-step">
                        <div className="how-step-number">3</div>
                        <h3>Connect</h3>
                        <p>Send a booking request. The coach responds directly.</p>
                    </div>
                </div>
            </section>

            {/* Become a Coach CTA */}
            <section className="btc-cta-section" style={{ marginTop: 0 }}>
                <h2 className="btc-cta-title">Got a skill to share?</h2>
                <p className="btc-cta-subtitle">
                    Earn money teaching what you love. Join as a coach today.
                </p>
                <button className="btn btn-accent btn-lg" onClick={() => navigate('/become-coach')}>
                    Become a Coach →
                </button>
            </section>
        </div>
    );
}
