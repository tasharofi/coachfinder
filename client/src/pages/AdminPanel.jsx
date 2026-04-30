import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getAdminCoaches, approveCoach, rejectCoach, suspendCoach, reactivateCoach, deleteCoach,
    getAdminUsers, suspendUser, unsuspendUser, deleteUser,
    getAdminSkills, createSkill, updateSkill, toggleSkill, deleteSkill,
    addSkillAlias, removeSkillAlias, approveSkill, mergeSkill, rejectSkill,
    getAdminContacts,
    getAdminPendingEdits, approvePendingEdit, rejectPendingEdit,
    getAdminReports, reviewReport, dismissReport,
} from '../services/api';

const STATUS_COLORS = {
    DRAFT: '#94a3b8', PENDING: '#f59e0b', APPROVED: '#22c55e', REJECTED: '#ef4444', SUSPENDED: '#64748b',
};

export default function AdminPanel() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('coaches');

    useEffect(() => {
        if (!user || !isAdmin) navigate('/dashboard');
    }, [user, isAdmin, navigate]);

    if (!user || !isAdmin) return null;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Admin Panel</h1>
                <p className="dashboard-subtitle">Manage coaches, users, skills, and contact requests</p>
            </div>

            <div className="tabs">
                {['coaches', 'users', 'skills', 'contacts', 'edits', 'reports'].map(t => (
                    <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                        {t === 'edits' ? 'Pending Edits' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {tab === 'coaches' && <CoachesTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'skills' && <SkillsTab />}
            {tab === 'contacts' && <ContactsTab />}
            {tab === 'edits' && <PendingEditsTab />}
            {tab === 'reports' && <ReportsTab />}
        </div>
    );
}

function CoachesTab() {
    const [coaches, setCoaches] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try { const d = await getAdminCoaches(statusFilter); setCoaches(d.coaches || []); }
        catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [statusFilter]);

    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') await approveCoach(id);
            else if (action === 'reject') await rejectCoach(id);
            else if (action === 'suspend') await suspendCoach(id);
            else if (action === 'reactivate') await reactivateCoach(id);
            else if (action === 'delete' && window.confirm('Remove this coach profile permanently?')) await deleteCoach(id);
            load();
        } catch (err) { alert(err.message); }
    };

    return (
        <div>
            <div className="admin-toolbar">
                <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '200px' }}>
                    <option value="">All statuses</option>
                    {['PENDING', 'APPROVED', 'DRAFT', 'REJECTED', 'SUSPENDED'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {loading ? <div className="loading">Loading...</div> : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Skill</th><th>Location</th><th>Rate</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {coaches.map(c => (
                                <tr key={c.id}>
                                    <td className="admin-name-cell">
                                        <strong>{c.user?.name}</strong>
                                        <br /><span className="admin-small">{c.headline}</span>
                                    </td>
                                    <td>{c.user?.email}</td>
                                    <td>{c.skills?.map(s => s.skill?.name).join(', ') || '—'}</td>
                                    <td>{c.suburb ? `${c.suburb}, ${c.state}` : '—'}</td>
                                    <td>${c.hourlyRate}</td>
                                    <td><span className="admin-status" style={{ background: STATUS_COLORS[c.status] + '22', color: STATUS_COLORS[c.status] }}>{c.status}</span></td>
                                    <td>
                                        <div className="admin-actions">
                                            {c.status === 'PENDING' && (
                                                <>
                                                    <button className="btn btn-sm" style={{ background: '#22c55e', color: '#fff' }} onClick={() => handleAction(c.id, 'approve')}>Approve</button>
                                                    <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleAction(c.id, 'reject')}>Reject</button>
                                                </>
                                            )}
                                            {c.status === 'APPROVED' && (
                                                <button className="btn btn-sm btn-outline" onClick={() => handleAction(c.id, 'suspend')}>Suspend</button>
                                            )}
                                            {c.status === 'SUSPENDED' && (
                                                <button className="btn btn-sm btn-outline" onClick={() => handleAction(c.id, 'reactivate')}>Reactivate</button>
                                            )}
                                            {c.status === 'REJECTED' && (
                                                <button className="btn btn-sm" style={{ background: '#22c55e', color: '#fff' }} onClick={() => handleAction(c.id, 'approve')}>Approve</button>
                                            )}
                                            <button className="btn btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleAction(c.id, 'delete')}>🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {coaches.length === 0 && <div className="empty-state"><p>No coaches found</p></div>}
                </div>
            )}
        </div>
    );
}

function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try { const d = await getAdminUsers(); setUsers(d.users || []); }
        catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSuspend = async (id, isSuspended) => {
        try {
            if (isSuspended) await unsuspendUser(id);
            else await suspendUser(id);
            load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user permanently?')) return;
        try { await deleteUser(id); load(); } catch (err) { alert(err.message); }
    };

    return (
        <div>
            {loading ? <div className="loading">Loading...</div> : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Type</th><th>Coach Status</th><th>Joined</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className={u.suspended ? 'admin-suspended' : ''}>
                                    <td><strong>{u.name}</strong></td>
                                    <td>{u.email}</td>
                                    <td>
                                        {u.isAdmin && <span className="admin-type-tag admin">Admin</span>}
                                        {u.isCoach && <span className="admin-type-tag coach">Coach</span>}
                                        {u.isLearner && <span className="admin-type-tag learner">Learner</span>}
                                    </td>
                                    <td>{u.coachProfile?.status || '—'}</td>
                                    <td>{new Date(u.createdAt).toLocaleDateString('en-AU')}</td>
                                    <td>
                                        <div className="admin-actions">
                                            {!u.isAdmin && (
                                                <>
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleSuspend(u.id, u.suspended)}>
                                                        {u.suspended ? 'Unsuspend' : 'Suspend'}
                                                    </button>
                                                    <button className="btn btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(u.id)}>🗑</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function SkillsTab() {
    const [skills, setSkills] = useState([]);
    const [newName, setNewName] = useState('');
    const [newParentGroup, setNewParentGroup] = useState('');
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editParentGroup, setEditParentGroup] = useState('');
    const [newAlias, setNewAlias] = useState({});
    const [showProposed, setShowProposed] = useState(false);
    const [mergeTarget, setMergeTarget] = useState({});
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const d = await getAdminSkills(showProposed ? true : undefined);
            setSkills(d.skills || []);
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [showProposed]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            await createSkill({ name: newName.trim(), parentGroup: newParentGroup.trim() });
            setNewName(''); setNewParentGroup('');
            load();
        } catch (err) { alert(err.message); }
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        try {
            await updateSkill(id, { name: editName.trim(), parentGroup: editParentGroup.trim() });
            setEditId(null);
            load();
        } catch (err) { alert(err.message); }
    };

    const handleToggle = async (id) => {
        try { await toggleSkill(id); load(); }
        catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this skill?')) return;
        try { await deleteSkill(id); load(); }
        catch (err) { alert(err.message); }
    };

    const handleAddAlias = async (skillId) => {
        const alias = (newAlias[skillId] || '').trim();
        if (!alias) return;
        try {
            await addSkillAlias(skillId, alias);
            setNewAlias(prev => ({ ...prev, [skillId]: '' }));
            load();
        } catch (err) { alert(err.message); }
    };

    const handleRemoveAlias = async (skillId, aliasId) => {
        try { await removeSkillAlias(skillId, aliasId); load(); }
        catch (err) { alert(err.message); }
    };

    const handleApprove = async (id) => {
        try { await approveSkill(id); load(); }
        catch (err) { alert(err.message); }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject and remove this proposed skill?')) return;
        try { await rejectSkill(id); load(); }
        catch (err) { alert(err.message); }
    };

    const handleMerge = async (sourceId) => {
        const targetId = mergeTarget[sourceId];
        if (!targetId) { alert('Select a target skill to merge into.'); return; }
        if (!window.confirm('Merge this skill into the selected target? This cannot be undone.')) return;
        try { await mergeSkill(sourceId, targetId); load(); }
        catch (err) { alert(err.message); }
    };

    const canonicalSkills = skills.filter(s => !s.isProposed);

    return (
        <div>
            <div className="admin-toolbar" style={{ flexWrap: 'wrap' }}>
                <form className="admin-toolbar" onSubmit={handleCreate} style={{ marginBottom: 0 }}>
                    <input className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New skill name" style={{ maxWidth: '200px' }} />
                    <input className="form-input" value={newParentGroup} onChange={(e) => setNewParentGroup(e.target.value)} placeholder="Parent group (optional)" style={{ maxWidth: '180px' }} />
                    <button type="submit" className="btn btn-primary btn-sm">Add Skill</button>
                </form>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', marginLeft: 'auto' }}>
                    <input type="checkbox" checked={showProposed} onChange={(e) => setShowProposed(e.target.checked)} />
                    Show proposed only
                </label>
            </div>

            {loading ? <div className="loading">Loading...</div> : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Name</th><th>Group</th><th>Aliases</th><th>Coaches</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {skills.map(s => (
                                <tr key={s.id} className={!s.enabled ? 'admin-suspended' : ''}>
                                    <td>
                                        {editId === s.id ? (
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexDirection: 'column' }}>
                                                <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                                                <input className="form-input" value={editParentGroup} onChange={(e) => setEditParentGroup(e.target.value)} placeholder="Parent group" />
                                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                    <button className="btn btn-sm btn-primary" onClick={() => handleUpdate(s.id)}>Save</button>
                                                    <button className="btn btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <strong>{s.name}</strong>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{s.parentGroup || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-2)' }}>
                                            {(s.aliases || []).map(a => (
                                                <span key={a.id} className="skill-tag" style={{ fontSize: 'var(--font-size-xs)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    {a.alias}
                                                    <button onClick={() => handleRemoveAlias(s.id, a.id)} style={{ fontSize: '10px', color: 'var(--color-error)', lineHeight: 1 }} title="Remove alias">×</button>
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <input
                                                className="form-input"
                                                value={newAlias[s.id] || ''}
                                                onChange={(e) => setNewAlias(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                placeholder="Add alias"
                                                style={{ fontSize: 'var(--font-size-xs)', padding: '2px 6px', maxWidth: '120px' }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAlias(s.id); } }}
                                            />
                                            <button className="btn btn-sm" onClick={() => handleAddAlias(s.id)} style={{ fontSize: 'var(--font-size-xs)', padding: '2px 6px' }}>+</button>
                                        </div>
                                    </td>
                                    <td>{s._count?.coaches || 0}</td>
                                    <td>
                                        {s.isProposed ? (
                                            <span className="admin-status" style={{ background: '#FEF3C722', color: '#f59e0b' }}>Proposed</span>
                                        ) : (
                                            s.enabled ? '✅' : '❌'
                                        )}
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            {s.isProposed ? (
                                                <>
                                                    <button className="btn btn-sm" style={{ background: '#22c55e', color: '#fff' }} onClick={() => handleApprove(s.id)}>Approve</button>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        <select
                                                            className="form-input"
                                                            value={mergeTarget[s.id] || ''}
                                                            onChange={(e) => setMergeTarget(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                            style={{ fontSize: 'var(--font-size-xs)', padding: '2px 4px', maxWidth: '120px' }}
                                                        >
                                                            <option value="">Merge into...</option>
                                                            {canonicalSkills.filter(cs => cs.id !== s.id).map(cs => (
                                                                <option key={cs.id} value={cs.id}>{cs.name}</option>
                                                            ))}
                                                        </select>
                                                        {mergeTarget[s.id] && (
                                                            <button className="btn btn-sm btn-outline" onClick={() => handleMerge(s.id)}>Merge</button>
                                                        )}
                                                    </div>
                                                    <button className="btn btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleReject(s.id)}>Reject</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn btn-sm btn-outline" onClick={() => { setEditId(s.id); setEditName(s.name); setEditParentGroup(s.parentGroup || ''); }}>Edit</button>
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleToggle(s.id)}>{s.enabled ? 'Disable' : 'Enable'}</button>
                                                    <button className="btn btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(s.id)}>🗑</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {skills.length === 0 && <div className="empty-state"><p>No skills found</p></div>}
                </div>
            )}
        </div>
    );
}

function ContactsTab() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getAdminContacts().then(d => setContacts(d.contactRequests || []))
            .catch(() => {}).finally(() => setLoading(false));
    }, []);

    return (
        <div>
            {loading ? <div className="loading">Loading...</div> : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr><th>From</th><th>To (Coach)</th><th>Message</th><th>Mode</th><th>Status</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {contacts.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <strong>{c.learnerName}</strong>
                                        <br /><span className="admin-small">{c.learnerEmail}</span>
                                    </td>
                                    <td>{c.coachProfile?.user?.name || '—'}</td>
                                    <td className="admin-msg-cell">{c.message || '—'}</td>
                                    <td>{c.preferredMode === 'IN_PERSON' ? 'In Person' : c.preferredMode === 'ONLINE' ? 'Online' : 'Either'}</td>
                                    <td><span className={`session-status ${c.status?.toLowerCase()}`}>{c.status}</span></td>
                                    <td>{new Date(c.createdAt).toLocaleDateString('en-AU')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {contacts.length === 0 && <div className="empty-state"><p>No contact requests yet</p></div>}
                </div>
            )}
        </div>
    );
}

// ============================================
// Pending Edits Tab
// ============================================

const FIELD_LABELS = {
    headline: 'Headline',
    bio: 'Bio / About',
    certifications: 'Certifications',
    linkedinUrl: 'LinkedIn / Website',
};

function PendingEditsTab() {
    const [edits, setEdits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [actionNotes, setActionNotes] = useState({});
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => { loadEdits(); }, [filter]);

    const loadEdits = async () => {
        setLoading(true);
        try {
            const data = await getAdminPendingEdits(filter);
            setEdits(data.pendingEdits || []);
        } catch (err) {
            console.error('Load pending edits error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approvePendingEdit(id, actionNotes[id] || '');
            loadEdits();
        } catch (err) { alert(err.message); }
    };

    const handleReject = async (id) => {
        try {
            await rejectPendingEdit(id, actionNotes[id] || '');
            loadEdits();
        } catch (err) { alert(err.message); }
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s)}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading">Loading pending edits...</div>
            ) : edits.length === 0 ? (
                <div className="empty-state"><p>No {filter.toLowerCase()} edits</p></div>
            ) : (
                <div className="pending-edits-admin">
                    {edits.map(edit => (
                        <div key={edit.id} className="admin-edit-card">
                            <div className="admin-edit-header" onClick={() => setExpandedId(expandedId === edit.id ? null : edit.id)}>
                                <div>
                                    <strong>{edit.coachProfile?.user?.name || 'Unknown'}</strong>
                                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
                                        {edit.coachProfile?.user?.email}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <span className={`pending-edit-status ${edit.status.toLowerCase()}`}>{edit.status}</span>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                        {new Date(edit.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span style={{ fontSize: 'var(--font-size-sm)' }}>{expandedId === edit.id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {expandedId === edit.id && (
                                <div className="admin-edit-details">
                                    <div className="admin-diff-view">
                                        {Object.entries(edit.changes || {}).map(([field, newValue]) => (
                                            <div key={field} className="admin-diff-row">
                                                <div className="admin-diff-label">{FIELD_LABELS[field] || field}</div>
                                                <div className="admin-diff-values">
                                                    <div className="admin-diff-old">
                                                        <span className="admin-diff-tag">Current</span>
                                                        <div className="admin-diff-content">{edit.coachProfile?.[field] || '(empty)'}</div>
                                                    </div>
                                                    <div className="admin-diff-arrow">→</div>
                                                    <div className="admin-diff-new">
                                                        <span className="admin-diff-tag">Proposed</span>
                                                        <div className="admin-diff-content">{newValue || '(empty)'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {edit.status === 'PENDING' && (
                                        <div style={{ marginTop: 'var(--space-4)' }}>
                                            <textarea
                                                className="form-input form-textarea"
                                                placeholder="Admin notes (optional)..."
                                                rows={2}
                                                value={actionNotes[edit.id] || ''}
                                                onChange={(e) => setActionNotes({ ...actionNotes, [edit.id]: e.target.value })}
                                                style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                                            />
                                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                <button className="btn btn-sm btn-primary" onClick={() => handleApprove(edit.id)}>
                                                    ✓ Approve & Apply
                                                </button>
                                                <button className="btn btn-sm btn-outline" style={{ color: 'var(--color-danger)' }} onClick={() => handleReject(edit.id)}>
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {edit.adminNotes && (
                                        <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                                            <strong>Admin notes:</strong> {edit.adminNotes}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================
// Reports Tab
// ============================================

const REASON_LABELS = {
    inappropriate: 'Inappropriate content',
    misleading: 'Misleading information',
    spam: 'Spam / scam',
    offensive_image: 'Offensive image',
    wrong_skill: 'Wrong skill / category',
};

function ReportsTab() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [actionNotes, setActionNotes] = useState({});

    useEffect(() => { loadReports(); }, [filter]);

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await getAdminReports(filter);
            setReports(data.reports || []);
        } catch (err) {
            console.error('Load reports error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id) => {
        try {
            await reviewReport(id, actionNotes[id] || '');
            loadReports();
        } catch (err) { alert(err.message); }
    };

    const handleDismiss = async (id) => {
        try {
            await dismissReport(id);
            loadReports();
        } catch (err) { alert(err.message); }
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {['', 'NEW', 'REVIEWED', 'DISMISSED'].map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s)}>
                        {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading">Loading reports...</div>
            ) : reports.length === 0 ? (
                <div className="empty-state"><p>No reports found</p></div>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Coach</th>
                                <th>Reason</th>
                                <th>Details</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td>
                                        <strong>{report.coachProfile?.user?.name || 'Unknown'}</strong>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                            {report.coachProfile?.user?.email}
                                        </div>
                                    </td>
                                    <td>{REASON_LABELS[report.reason] || report.reason}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {report.details || '—'}
                                    </td>
                                    <td>
                                        <span className={`pending-edit-status ${report.status.toLowerCase()}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td>{new Date(report.createdAt).toLocaleDateString('en-AU')}</td>
                                    <td>
                                        {report.status === 'NEW' && (
                                            <div style={{ display: 'flex', gap: 'var(--space-1)', flexDirection: 'column' }}>
                                                <input
                                                    className="form-input"
                                                    placeholder="Notes..."
                                                    value={actionNotes[report.id] || ''}
                                                    onChange={(e) => setActionNotes({ ...actionNotes, [report.id]: e.target.value })}
                                                    style={{ fontSize: 'var(--font-size-xs)', padding: '4px 8px', height: '28px' }}
                                                />
                                                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleReview(report.id)} style={{ fontSize: 'var(--font-size-xs)' }}>
                                                        Review
                                                    </button>
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleDismiss(report.id)} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {report.adminNotes && (
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                                                {report.adminNotes}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
