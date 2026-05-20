import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applyAsCoach, getCoachStatus, uploadPhoto, resolveSkill } from '../services/api';
import SuburbAutocomplete from '../components/SuburbAutocomplete';
import AvailabilityPicker from '../components/AvailabilityPicker';
import SkillAutocomplete from '../components/SkillAutocomplete';
import VerifyEmailBanner from '../components/VerifyEmailBanner';

const MAX_SKILLS = 5;

export default function CoachApplication() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [existingStatus, setExistingStatus] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');

    const [form, setForm] = useState({
        headline: '', bio: '', sessionMode: 'BOTH',
        suburb: '', state: '', postcode: '', lat: null, lng: null,
        serviceRadius: '', hourlyRate: '', yearsExp: '',
        certifications: '', linkedinUrl: '', phone: '', email: user?.email || '',
        availability: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/login?redirect=/apply-coach'); return; }
        getCoachStatus().then(d => {
            if (d.hasProfile && d.profile) {
                setExistingStatus(d.profile.status);
                if (d.profile.status === 'APPROVED') {
                    navigate('/dashboard');
                    return;
                }
                // Pre-fill form from existing profile
                const p = d.profile;
                setForm({
                    headline: p.headline || '', bio: p.bio || '',
                    sessionMode: p.sessionMode || 'BOTH',
                    suburb: p.suburb || '', state: p.state || '', postcode: p.postcode || '',
                    lat: p.lat, lng: p.lng, serviceRadius: p.serviceRadius || '',
                    hourlyRate: p.hourlyRate || '', yearsExp: p.yearsExp || '',
                    certifications: p.certifications || '', linkedinUrl: p.linkedinUrl || '',
                    phone: p.phone || '', email: p.email || user?.email || '',
                    availability: (() => { try { return JSON.parse(p.availability || '[]'); } catch { return []; } })(),
                });
                // Pre-fill existing skills
                if (p.skills?.length > 0) {
                    setSelectedSkills(p.skills.map(cs => ({
                        id: cs.skillId || cs.skill?.id,
                        name: cs.skill?.name || 'Unknown',
                        isProposed: cs.skill?.status === 'PROPOSED',
                    })));
                }
            }
        }).catch(() => {});
    }, [user, navigate]);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = await uploadPhoto(file);
            const previewUrl = data.url.startsWith('http') ? data.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${data.url}`;
            setPhotoPreview(previewUrl);
        } catch (err) {
            setError('Photo upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSuburbChange = (s) => {
        setForm(prev => ({
            ...prev, suburb: s.suburb, state: s.state, postcode: s.postcode,
            lat: s.lat, lng: s.lng,
        }));
    };

    // --- Multi-skill handlers ---
    const handleSkillSelect = (s) => {
        if (!s.id) return;
        const canonicalName = s.resolvedName || s.name;
        if (selectedSkills.length >= MAX_SKILLS) return;
        if (selectedSkills.some(sk => sk.id === s.id)) {
            setError(`"${canonicalName}" is already added.`);
            return;
        }
        setSelectedSkills(prev => [...prev, { id: s.id, name: canonicalName, isProposed: false }]);
        setSkillInput('');
        setError('');
    };

    const handleCustomSkill = async (name, opts) => {
        if (selectedSkills.length >= MAX_SKILLS) return;
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 60) {
            setError('Skill name must be 2–60 characters.');
            return;
        }
        // Check for duplicates (case-insensitive)
        if (selectedSkills.some(sk => sk.name.toLowerCase() === trimmed.toLowerCase())) {
            setError(`"${trimmed}" is already added.`);
            return;
        }
        try {
            const result = await resolveSkill(trimmed);
            if (result.skill) {
                if (selectedSkills.some(sk => sk.id === result.skill.id)) {
                    setError(`"${trimmed}" maps to "${result.skill.name}" which is already added.`);
                    return;
                }
                setSelectedSkills(prev => [...prev, {
                    id: result.skill.id,
                    name: result.skill.name,
                    isProposed: result.isProposed || false,
                }]);
            }
        } catch (err) {
            setError(err.message || 'Could not add skill.');
        }
        setSkillInput('');
    };

    const removeSkill = (skillId) => {
        setSelectedSkills(prev => prev.filter(s => s.id !== skillId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.headline || !form.bio || !form.email) {
            setError('Please fill in headline, bio, and email.');
            return;
        }
        if (selectedSkills.length === 0) {
            setError('Please add at least one skill.');
            return;
        }
        if (!form.hourlyRate || parseFloat(form.hourlyRate) <= 0) {
            setError('Please set a valid hourly rate.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await applyAsCoach({
                ...form,
                hourlyRate: parseFloat(form.hourlyRate),
                yearsExp: parseInt(form.yearsExp) || 0,
                availability: JSON.stringify(form.availability),
                skillId: selectedSkills.map(s => s.id),
            });
            setSuccess(true);
            await refreshUser();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    if (success || existingStatus === 'PENDING') {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
                    <h1 className="auth-title">Application Submitted</h1>
                    <div className="coach-status-banner pending">
                        Your coach profile is under review and is not live yet.
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
                        Your profile will become visible to learners once approved by our team.
                        We'll notify you by email.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: 'var(--space-6)' }}>
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (existingStatus === 'REJECTED') {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>❌</div>
                    <h1 className="auth-title">Application Not Approved</h1>
                    <div className="coach-status-banner rejected">
                        Your previous application was not approved. You may update and resubmit.
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={() => setExistingStatus('DRAFT')} style={{ width: '100%', marginTop: 'var(--space-6)' }}>
                        Edit & Resubmit
                    </button>
                </div>
            </div>
        );
    }

    const suburbDisplay = form.suburb ? `${form.suburb}, ${form.state} ${form.postcode}` : '';
    const atLimit = selectedSkills.length >= MAX_SKILLS;

    return (
        <div className="apply-page">
            <div className="apply-card">
                <h1 className="auth-title">Coach Application</h1>
                <p className="auth-subtitle">Complete your profile to apply as a coach. All fields with * are required.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form className="apply-form" onSubmit={handleSubmit}>
                    {/* Photo */}
                    <div className="form-group">
                        <label className="form-label">Profile photo</label>
                        <div className="photo-upload">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="photo-preview" />
                            ) : (
                                <div className="photo-placeholder">📷</div>
                            )}
                            <label className="btn btn-outline btn-sm photo-upload-btn">
                                {uploading ? 'Uploading...' : 'Choose Photo'}
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                            </label>
                        </div>
                    </div>

                    {/* Skills — multi-select with chips */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="apply-skill">What do you teach? *</label>
                        <p className="form-helper">Add up to {MAX_SKILLS} skills, subjects or activities you can teach.</p>
                        {selectedSkills.length > 0 && (
                            <div className="skill-chips">
                                {selectedSkills.map(s => (
                                    <span key={s.id} className={`skill-chip ${s.isProposed ? 'skill-chip-proposed' : ''}`}>
                                        {s.name}
                                        {s.isProposed && <span className="skill-chip-badge">Pending</span>}
                                        <button type="button" className="skill-chip-remove" onClick={() => removeSkill(s.id)} title="Remove skill">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {atLimit ? (
                            <p className="form-helper" style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                                You can add up to {MAX_SKILLS} skills.
                            </p>
                        ) : (
                            <SkillAutocomplete
                                value={skillInput}
                                onChange={setSkillInput}
                                onSelect={handleSkillSelect}
                                onCustomSubmit={handleCustomSkill}
                                clearOnSelect
                                placeholder="e.g. Piano, Tennis, Maths..."
                                id="apply-skill"
                                mode="coach"
                                excludeIds={new Set(selectedSkills.map(s => s.id))}
                                excludeNames={new Set(selectedSkills.map(s => s.name.toLowerCase()))}
                            />
                        )}
                    </div>

                    {/* Headline */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="apply-headline">Short headline / title *</label>
                        <input id="apply-headline" className="form-input" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Certified Tennis Coach — All Levels" required />
                    </div>

                    {/* Bio */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="apply-bio">About you / Bio *</label>
                        <textarea id="apply-bio" className="form-input form-textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell learners about your experience, teaching style, and what they can expect..." rows={4} required />
                    </div>

                    {/* Session mode */}
                    <div className="form-group">
                        <label className="form-label">Service mode *</label>
                        <div className="form-toggle">
                            {['IN_PERSON', 'ONLINE', 'BOTH'].map(mode => (
                                <button key={mode} type="button" className={`form-toggle-option ${form.sessionMode === mode ? 'active' : ''}`} onClick={() => setForm({ ...form, sessionMode: mode })}>
                                    {mode === 'IN_PERSON' ? 'In Person' : mode === 'ONLINE' ? 'Online' : 'Both'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <label className="form-label">Location (Australian suburb) *</label>
                        <SuburbAutocomplete value={suburbDisplay} onChange={handleSuburbChange} placeholder="Start typing your suburb..." id="apply-suburb" />
                    </div>

                    {/* Service radius */}
                    {form.sessionMode !== 'ONLINE' && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="apply-radius">Service area description</label>
                            <input id="apply-radius" className="form-input" value={form.serviceRadius} onChange={(e) => setForm({ ...form, serviceRadius: e.target.value })} placeholder="e.g. Eastern Suburbs Sydney, Inner West" />
                        </div>
                    )}

                    {/* Price & Experience */}
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="apply-rate">Hourly rate ($) *</label>
                            <input id="apply-rate" className="form-input" type="number" min="1" step="5" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="apply-exp">Years of experience</label>
                            <input id="apply-exp" className="form-input" type="number" min="0" value={form.yearsExp} onChange={(e) => setForm({ ...form, yearsExp: e.target.value })} />
                        </div>
                    </div>

                    {/* Certifications */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="apply-certs">Certifications / credentials (optional)</label>
                        <textarea id="apply-certs" className="form-input form-textarea" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} placeholder="List any relevant certifications, qualifications, or credentials" rows={2} />
                    </div>

                    {/* LinkedIn */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="apply-linkedin">LinkedIn / Website (optional)</label>
                        <input id="apply-linkedin" className="form-input" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/you" />
                    </div>

                    {/* Availability */}
                    <div className="form-group">
                        <label className="form-label">Broad availability</label>
                        <AvailabilityPicker value={form.availability} onChange={(v) => setForm({ ...form, availability: v })} />
                    </div>

                    {/* Contact */}
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="apply-email">Email *</label>
                            <input id="apply-email" className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="apply-phone">Phone (optional)</label>
                            <input id="apply-phone" className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="04xx xxx xxx" />
                        </div>
                    </div>

                    {!user?.emailVerified && (
                        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
                            📧 Please verify your email before submitting your coach application.
                        </div>
                    )}

                    <button type="submit" className="btn btn-accent btn-lg" disabled={loading || !user?.emailVerified} style={{ width: '100%' }}>
                        {loading ? 'Submitting...' : !user?.emailVerified ? 'Verify Email to Submit' : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
}
