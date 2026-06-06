import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchCoaches } from '../services/api';
import { VerifiedCoachBadge, EmailVerifiedBadge } from '../components/VerifiedBadge';
import { formatAvailability } from '../components/AvailabilityPicker';
import ContactRequestModal from '../components/ContactRequestModal';
import SuburbAutocomplete from '../components/SuburbAutocomplete';
import SkillAutocomplete from '../components/SkillAutocomplete';
import { MapPin, BadgeDollarSign, MonitorSmartphone, Award } from 'lucide-react';

const SESSION_MODE_LABELS = { IN_PERSON: 'In Person', ONLINE: 'Online', BOTH: 'In Person & Online' };
const PRICE_RANGES = [
    { label: 'Any price', min: '', max: '' },
    { label: 'Under $30', min: '', max: '30' },
    { label: '$30–$60', min: '30', max: '60' },
    { label: '$60–$100', min: '60', max: '100' },
    { label: '$100+', min: '100', max: '' },
];
const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price_asc', label: 'Lowest price' },
    { value: 'price_desc', label: 'Highest price' },
    { value: 'nearest', label: 'Nearest' },
    { value: 'newest', label: 'Newest' },
];

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [coaches, setCoaches] = useState([]);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContact, setShowContact] = useState(false);

    const [skill, setSkill] = useState(searchParams.get('skill') || '');
    const [suburb, setSuburb] = useState(searchParams.get('suburb') || '');
    const [sessionMode, setSessionMode] = useState(searchParams.get('sessionMode') || '');
    const [priceRange, setPriceRange] = useState(0);
    const [availability, setAvailability] = useState(searchParams.get('availability') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recommended');
    const [mobileShowDetail, setMobileShowDetail] = useState(false);
    const scrollPosRef = useRef(0);

    const fetchCoaches = useCallback(async (filters) => {
        setLoading(true);
        try {
            const params = {};
            if (filters.skill) params.skill = filters.skill;
            if (filters.suburb) params.suburb = filters.suburb;
            if (filters.sessionMode) params.sessionMode = filters.sessionMode;
            if (PRICE_RANGES[filters.priceRange]?.min) params.priceMin = PRICE_RANGES[filters.priceRange].min;
            if (PRICE_RANGES[filters.priceRange]?.max) params.priceMax = PRICE_RANGES[filters.priceRange].max;
            if (filters.availability) params.availability = filters.availability;
            if (filters.sortBy) params.sortBy = filters.sortBy;

            const data = await searchCoaches(params);
            setCoaches(data.coaches || []);
        } catch { setCoaches([]); }
        finally { setLoading(false); }
    }, []);

    // Only fetch on initial mount using URL params
    useEffect(() => {
        fetchCoaches({
            skill: searchParams.get('skill') || '',
            suburb: searchParams.get('suburb') || '',
            sessionMode: searchParams.get('sessionMode') || '',
            priceRange: 0,
            availability: searchParams.get('availability') || '',
            sortBy: searchParams.get('sortBy') || 'recommended',
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams();
        if (skill) params.set('skill', skill);
        if (suburb) params.set('suburb', suburb);
        if (sessionMode) params.set('sessionMode', sessionMode);
        if (availability) params.set('availability', availability);
        if (sortBy !== 'recommended') params.set('sortBy', sortBy);
        setSearchParams(params);
        // Fetch with current filter state
        fetchCoaches({ skill, suburb, sessionMode, priceRange, availability, sortBy });
    };

    // Sync mobileShowDetail with URL — handles browser back button
    useEffect(() => {
        const coachSlug = searchParams.get('coach');
        if (coachSlug && coaches.length) {
            const match = coaches.find(c => c.user?.slug === coachSlug || c.id === coachSlug);
            if (match) {
                setSelectedCoach(match);
                setMobileShowDetail(true);
            }
        } else if (!coachSlug && mobileShowDetail) {
            // Coach param removed (e.g. browser back) — return to list
            setMobileShowDetail(false);
            setSelectedCoach(null);
            requestAnimationFrame(() => {
                window.scrollTo(0, scrollPosRef.current);
            });
        }
    }, [searchParams, coaches]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectCoach = (coach) => {
        scrollPosRef.current = window.scrollY;
        setSelectedCoach(coach);
        setMobileShowDetail(true);
        window.scrollTo(0, 0);
        const params = new URLSearchParams(searchParams);
        params.set('coach', coach.user?.slug || coach.id);
        setSearchParams(params);
    };

    const handleBackToList = () => {
        // Navigate back in history so device back button and this button behave the same
        navigate(-1);
    };

    return (
        <div>
            {/* Filters Bar */}
            <div className={`search-filters ${mobileShowDetail ? 'mobile-hidden' : ''}`}>
                <form className="search-filters-row" onSubmit={handleSearch}>
                    <div className="filter-cell filter-cell-grow">
                        <SkillAutocomplete
                            value={skill}
                            onChange={(val) => setSkill(val)}
                            onSelect={(s) => setSkill(s.name)}
                            placeholder="Skill, subject or activity"
                            id="filter-skill"
                            allowCreate={false}
                        />
                    </div>
                    <div className="filter-cell filter-cell-grow">
                        <SuburbAutocomplete value={suburb} onChange={(s) => setSuburb(s.suburb || s.display || '')} placeholder="Suburb" id="filter-suburb" />
                    </div>
                    <div className="filter-cell">
                        <select className="filter-input" value={sessionMode} onChange={(e) => setSessionMode(e.target.value)}>
                            <option value="">Any type</option>
                            <option value="IN_PERSON">In Person</option>
                            <option value="ONLINE">Online</option>
                        </select>
                    </div>
                    <div className="filter-cell">
                        <select className="filter-input" value={priceRange} onChange={(e) => setPriceRange(parseInt(e.target.value))}>
                            {PRICE_RANGES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                        </select>
                    </div>
                    <div className="filter-cell">
                        <select className="filter-input" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                            <option value="">Any time</option>
                            <option value="weekdays">Weekdays</option>
                            <option value="evenings">Evenings</option>
                            <option value="weekends">Weekends</option>
                        </select>
                    </div>
                    <div className="filter-cell filter-cell-btn">
                        <button type="submit" className="btn btn-primary filter-search-btn" id="filter-search-btn">Search</button>
                    </div>
                </form>
            </div>

            {/* Split Pane */}
            <div className="search-layout">
                <div className={`search-list ${mobileShowDetail ? 'mobile-hidden' : ''}`}>
                    <div className="search-sub-bar">
                        <span className="search-result-count">
                            {loading ? 'Searching...' : `${coaches.length} coach${coaches.length !== 1 ? 'es' : ''} found`}
                        </span>
                        <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div className="search-list-cards">
                        {loading ? (
                            <div className="loading">Searching coaches...</div>
                        ) : coaches.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <h3 style={{ marginBottom: 'var(--space-2)' }}>No matching coaches yet</h3>
                                <p>Try a nearby suburb, a broader skill, or check back soon as more coaches join Skill Next Door.</p>
                                <button className="btn btn-primary btn-sm" onClick={() => { setSkill(''); setSuburb(''); setSessionMode(''); setPriceRange(0); setAvailability(''); handleSearch(); }} style={{ marginTop: 'var(--space-4)' }}>Clear filters</button>
                            </div>
                        ) : (
                            coaches.map((coach) => (
                                <div key={coach.id} className={`coach-card ${selectedCoach?.id === coach.id ? 'selected' : ''}`} onClick={() => selectCoach(coach)} id={`coach-card-${coach.id}`}>
                                    <div className="coach-card-header">
                                        <div>
                                            <div className="coach-card-name">{coach.user?.name}</div>
                                            <div className="coach-card-badges">
                                                {coach.status === 'APPROVED' && <VerifiedCoachBadge size="small" />}
                                                {coach.user?.emailVerified && <EmailVerifiedBadge size="small" />}
                                            </div>
                                        </div>
                                        <button className="coach-card-open" onClick={(e) => { e.stopPropagation(); window.open(`/coach/${coach.user?.slug}`, '_blank'); }} title="Open in new tab" aria-label="Open profile in new tab">↗</button>
                                    </div>
                                    {coach.headline && <div className="coach-card-headline">{coach.headline}</div>}
                                    <div className="coach-card-meta">
                                        {coach.suburb && <span><MapPin size={16} strokeWidth={1.75} /> {coach.suburb}, {coach.state}</span>}
                                        {coach.hourlyRate > 0 && <span><BadgeDollarSign size={16} strokeWidth={1.75} /> ${coach.hourlyRate}/hr</span>}
                                        {coach.sessionMode && <span><MonitorSmartphone size={16} strokeWidth={1.75} /> {SESSION_MODE_LABELS[coach.sessionMode] || coach.sessionMode}</span>}
                                        {coach.yearsExp > 0 && <span><Award size={16} strokeWidth={1.75} /> {coach.yearsExp} yr{coach.yearsExp !== 1 ? 's' : ''} exp</span>}
                                    </div>
                                    {coach.skills?.length > 0 && (
                                        <div className="coach-card-skills">
                                            {coach.skills.map((s) => (
                                                <span key={s.skill?.id || s.id} className="skill-tag">{s.skill?.name || s.name}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="coach-card-avail">{formatAvailability(coach.availability)}</div>
                                    {coach.bio && <p className="coach-card-bio">{coach.bio}</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={`search-detail ${!mobileShowDetail ? 'mobile-hidden' : ''}`}>
                    {selectedCoach ? (
                        <CoachDetailPanel coach={selectedCoach} onBack={handleBackToList} onContact={() => setShowContact(true)} />
                    ) : (
                        <div className="search-detail-empty">Select a coach to view their profile</div>
                    )}
                </div>
            </div>

            {showContact && selectedCoach && (
                <ContactRequestModal coach={selectedCoach} onClose={() => setShowContact(false)} onSent={() => setShowContact(false)} />
            )}
        </div>
    );
}

function CoachDetailPanel({ coach, onBack, onContact }) {
    const availText = formatAvailability(coach.availability);

    return (
        <div>
            <button className="mobile-back-btn" onClick={onBack}>← Back to results</button>

            <div className="detail-header">
                <div>
                    <h2 className="detail-name">{coach.user?.name}</h2>
                    <div className="coach-card-badges" style={{ marginTop: 'var(--space-2)' }}>
                        {coach.status === 'APPROVED' && <VerifiedCoachBadge />}
                        {coach.user?.emailVerified && <EmailVerifiedBadge />}
                    </div>
                </div>
                <button className="detail-open-link" onClick={() => window.open(`/coach/${coach.user?.slug}`, '_blank')}>
                    Open full profile ↗
                </button>
            </div>

            {coach.headline && <p className="detail-headline">{coach.headline}</p>}

            <div className="detail-meta">
                {coach.suburb && <span className="detail-meta-item"><MapPin size={16} strokeWidth={1.75} /> {coach.suburb}, {coach.state} {coach.postcode}</span>}
                {coach.hourlyRate > 0 && <span className="detail-meta-item"><BadgeDollarSign size={16} strokeWidth={1.75} /> ${coach.hourlyRate}/hr</span>}
                {coach.sessionMode && <span className="detail-meta-item"><MonitorSmartphone size={16} strokeWidth={1.75} /> {SESSION_MODE_LABELS[coach.sessionMode]}</span>}
                {coach.yearsExp > 0 && <span className="detail-meta-item"><Award size={16} strokeWidth={1.75} /> {coach.yearsExp} years experience</span>}
            </div>

            {coach.skills?.length > 0 && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Skills</h3>
                    <div className="coach-card-skills">
                        {coach.skills.map((s) => (
                            <span key={s.skill?.id || s.id} className="skill-tag">{s.skill?.name || s.name}</span>
                        ))}
                    </div>
                </div>
            )}

            {coach.bio && (
                <div className="detail-section">
                    <h3 className="detail-section-title">About</h3>
                    <p className="detail-bio">{coach.bio}</p>
                </div>
            )}

            {coach.certifications && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Certifications</h3>
                    <p className="detail-bio">{coach.certifications}</p>
                </div>
            )}

            {availText !== 'Not specified' && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Availability</h3>
                    <p className="detail-bio">{availText}</p>
                </div>
            )}

            <button className="btn btn-accent btn-lg" onClick={onContact} style={{ width: '100%', marginBottom: 'var(--space-8)' }}>
                Request a Session
            </button>
        </div>
    );
}
