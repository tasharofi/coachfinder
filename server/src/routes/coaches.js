const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { track } = require('../utils/analytics');
const { sendNewApplicationNotification } = require('../utils/email');
const { getNearbyPostcodes, findSuburb } = require('../utils/suburbs-data');
const AIService = require('../utils/ai-service');

const router = express.Router();

// GET /api/coaches — Search approved coaches
router.get('/', async (req, res) => {
    try {
        const {
            skill, suburb, state, sessionMode, priceMin, priceMax,
            availability, sortBy, page = 1, limit = 20,
        } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            status: 'APPROVED',
            user: { suspended: false },
        };

        // Skill filter — match canonical names, aliases, then fallback to bio/headline
        let skillFallbackText = null;
        if (skill) {
            // Find matching canonical skill IDs via name or alias
            const matchedByName = await prisma.skill.findMany({
                where: {
                    enabled: true,
                    isProposed: false,
                    name: { contains: skill },
                },
                select: { id: true },
            });
            const matchedByAlias = await prisma.skillAlias.findMany({
                where: {
                    alias: { contains: skill },
                    skill: { enabled: true, isProposed: false },
                },
                select: { skillId: true },
            });
            const matchedIds = [...new Set([
                ...matchedByName.map(s => s.id),
                ...matchedByAlias.map(a => a.skillId),
            ])];

            if (matchedIds.length > 0) {
                where.skills = {
                    some: {
                        skillId: { in: matchedIds },
                    },
                };
            } else {
                // Fallback: search headline and bio text
                skillFallbackText = skill;
            }
        }

        // Location filter — search by suburb + nearby postcodes
        if (suburb) {
            const nearbyPostcodes = getNearbyPostcodes(suburb, state || '', 15);
            if (nearbyPostcodes.length > 0) {
                where.OR = [
                    { suburb: { contains: suburb } },
                    { postcode: { in: nearbyPostcodes } },
                ];
            } else {
                where.suburb = { contains: suburb };
            }
        }

        // Session mode filter
        if (sessionMode && ['IN_PERSON', 'ONLINE', 'BOTH'].includes(sessionMode)) {
            if (sessionMode === 'BOTH') {
                // Show coaches that offer any mode
            } else {
                where.sessionMode = { in: [sessionMode, 'BOTH'] };
            }
        }

        // Price range filter
        if (priceMin) {
            where.hourlyRate = { ...(where.hourlyRate || {}), gte: parseFloat(priceMin) };
        }
        if (priceMax) {
            where.hourlyRate = { ...(where.hourlyRate || {}), lte: parseFloat(priceMax) };
        }

        // Availability filter (weekdays/evenings/weekends)
        // We'll do this in-memory since availability is stored as JSON string
        let availFilter = null;
        if (availability) {
            availFilter = availability; // 'weekdays' | 'evenings' | 'weekends'
        }

        // Sort order
        let orderBy = { createdAt: 'desc' }; // default = newest
        if (sortBy === 'price_asc') orderBy = { hourlyRate: 'asc' };
        else if (sortBy === 'price_desc') orderBy = { hourlyRate: 'desc' };
        else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
        // 'recommended' uses default (newest for MVP)
        // 'nearest' is handled post-query if suburb coords available

        const coaches = await prisma.coachProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true, name: true, slug: true, avatar: true,
                        emailVerified: true,
                    },
                },
                skills: { include: { skill: true } },
            },
            skip,
            take: parseInt(limit),
            orderBy,
        });

        // Post-filter by availability if requested
        let filtered = coaches;

        // Apply headline/bio fallback filter if no structured skill match was found
        if (skillFallbackText) {
            const lowerKeyword = skillFallbackText.toLowerCase();
            filtered = filtered.filter(coach => {
                const headline = (coach.headline || '').toLowerCase();
                const bio = (coach.bio || '').toLowerCase();
                return headline.includes(lowerKeyword) || bio.includes(lowerKeyword);
            });
        }

        if (availFilter) {
            filtered = filtered.filter(coach => {
                try {
                    const avail = JSON.parse(coach.availability || '[]');
                    if (availFilter === 'weekdays') {
                        return avail.some(a => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(a.day));
                    }
                    if (availFilter === 'evenings') {
                        return avail.some(a => a.times && a.times.includes('Evening'));
                    }
                    if (availFilter === 'weekends') {
                        return avail.some(a => ['Saturday', 'Sunday'].includes(a.day));
                    }
                } catch { return true; }
                return true;
            });
        }

        // Sort by distance if sortBy=nearest and suburb provided
        if (sortBy === 'nearest' && suburb) {
            const baseSuburb = findSuburb(suburb, state || '');
            if (baseSuburb && baseSuburb.lat && baseSuburb.lng) {
                const { haversineDistance } = require('../utils/suburbs-data');
                filtered.sort((a, b) => {
                    const distA = a.lat && a.lng ? haversineDistance(baseSuburb.lat, baseSuburb.lng, a.lat, a.lng) : 9999;
                    const distB = b.lat && b.lng ? haversineDistance(baseSuburb.lat, baseSuburb.lng, b.lat, b.lng) : 9999;
                    return distA - distB;
                });
            }
        }

        const total = await prisma.coachProfile.count({ where });

        track.searchPerformed({ skill, suburb, sessionMode, priceMin, priceMax, availability, sortBy });

        res.json({ coaches: filtered, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Search coaches error:', error);
        res.status(500).json({ error: 'Failed to search coaches' });
    }
});

// GET /api/coaches/categories — Get enabled categories/skills (backward compat)
router.get('/categories', async (req, res) => {
    try {
        const skills = await prisma.skill.findMany({
            where: { enabled: true, isProposed: false },
            orderBy: { name: 'asc' },
            include: { aliases: true },
        });
        res.json({ categories: skills });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/coaches/skills/autocomplete — Typeahead suggestions (keyword refinement)
router.get('/skills/autocomplete', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const lowerQ = q.toLowerCase().trim();

        // 1. Find matching skills (canonical + user-created)
        const matchedSkills = await prisma.skill.findMany({
            where: {
                enabled: true,
                name: { contains: q },
            },
            select: { id: true, name: true, parentGroup: true },
            take: 10,
        });

        // 2. Find matching aliases
        const matchedAliases = await prisma.skillAlias.findMany({
            where: {
                alias: { contains: q },
                skill: { enabled: true },
            },
            select: {
                alias: true,
                skill: { select: { id: true, name: true, parentGroup: true } },
            },
            take: 20,
        });

        // 3. Build suggestion list: each item is a display label + the canonical skill it resolves to
        const suggestions = [];
        const seenLabels = new Set();

        // Helper to score relevance (lower = better)
        const relevanceScore = (text) => {
            const lower = text.toLowerCase();
            if (lower === lowerQ) return 0;                    // exact match
            if (lower.startsWith(lowerQ)) return 1;            // starts with query
            if (lower.includes(lowerQ)) return 2;              // contains query
            return 3;
        };

        // Add canonical skills as suggestions
        for (const s of matchedSkills) {
            const label = s.name;
            if (!seenLabels.has(label.toLowerCase())) {
                seenLabels.add(label.toLowerCase());
                suggestions.push({
                    id: s.id,
                    name: s.name,
                    label: s.name,
                    parentGroup: s.parentGroup,
                    isCanonical: true,
                    score: relevanceScore(s.name),
                });
            }
        }

        // Add alias suggestions (show the alias text, resolve to the canonical skill)
        for (const a of matchedAliases) {
            const aliasLabel = a.alias.charAt(0).toUpperCase() + a.alias.slice(1); // capitalize
            const canonicalName = a.skill.name;

            // Skip if alias is identical to canonical name
            if (aliasLabel.toLowerCase() === canonicalName.toLowerCase()) continue;
            if (seenLabels.has(aliasLabel.toLowerCase())) continue;

            seenLabels.add(aliasLabel.toLowerCase());
            suggestions.push({
                id: a.skill.id,
                name: canonicalName,
                label: aliasLabel,
                parentGroup: a.skill.parentGroup,
                isCanonical: false,
                parentSkill: canonicalName,
                score: relevanceScore(a.alias),
            });
        }

        // 4. Sort by relevance: exact > starts-with > contains, canonical first within same score
        suggestions.sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            if (a.isCanonical !== b.isCanonical) return a.isCanonical ? -1 : 1;
            return a.label.localeCompare(b.label);
        });

        // 5. Cap at 7 suggestions
        res.json({ suggestions: suggestions.slice(0, 7) });
    } catch (error) {
        console.error('Skills autocomplete error:', error);
        res.status(500).json({ error: 'Failed to search skills' });
    }
});

// POST /api/coaches/skills/resolve — Resolve typed text to canonical skill
router.post('/skills/resolve', authenticate, async (req, res) => {
    try {
        const { text, force } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const normalised = text.trim().toLowerCase();

        // If force=true, skip all matching and create a new skill directly
        if (force) {
            // Still check if exact canonical name already exists
            const existing = await prisma.skill.findFirst({
                where: { name: { equals: text.trim() } },
            });
            if (existing) {
                return res.json({ matched: true, skill: { id: existing.id, name: existing.name } });
            }

            const proposed = await prisma.skill.create({
                data: {
                    name: text.trim(),
                    enabled: true,
                    isProposed: true,
                    proposedBy: req.user.id,
                },
            });
            return res.json({ matched: false, proposed: true, skill: { id: proposed.id, name: proposed.name } });
        }

        // 1. Exact match on canonical name (case-insensitive)
        let match = await prisma.skill.findFirst({
            where: {
                enabled: true,
                name: { equals: text.trim() },
            },
        });

        // 2. Case-insensitive / normalised match
        if (!match) {
            const allSkills = await prisma.skill.findMany({
                where: { enabled: true, isProposed: false },
            });
            match = allSkills.find(s => s.name.toLowerCase() === normalised);
        }

        // 3. Alias match
        if (!match) {
            const aliasMatch = await prisma.skillAlias.findFirst({
                where: { alias: { equals: text.trim() } },
                include: { skill: true },
            });
            if (aliasMatch && aliasMatch.skill.enabled) {
                match = aliasMatch.skill;
            }
        }

        // 4. Normalised alias match
        if (!match) {
            const allAliases = await prisma.skillAlias.findMany({
                include: { skill: true },
            });
            const aliasHit = allAliases.find(a => a.alias.toLowerCase() === normalised && a.skill.enabled);
            if (aliasHit) match = aliasHit.skill;
        }

        // 4.5. AI-assisted normalisation (suggestion only — no auto-saving aliases)
        if (!match && AIService.isEnabled()) {
            try {
                const allSkillNames = await prisma.skill.findMany({
                    where: { enabled: true, isProposed: false },
                    select: { id: true, name: true },
                });
                const aiResult = await AIService.normaliseCoachSkill(text.trim(), allSkillNames.map(s => s.name));

                if (aiResult && aiResult.canonicalSkillSuggestion && aiResult.confidence === 'high') {
                    const aiMatch = allSkillNames.find(s => s.name.toLowerCase() === aiResult.canonicalSkillSuggestion.toLowerCase());
                    if (aiMatch) {
                        match = await prisma.skill.findUnique({ where: { id: aiMatch.id } });
                    }
                }
                // Note: No longer auto-saving AI-suggested aliases to prevent pollution
            } catch (aiErr) {
                console.error('AI skill normalisation failed (continuing without):', aiErr.message);
            }
        }

        if (match) {
            return res.json({ matched: true, skill: { id: match.id, name: match.name } });
        }

        // 5. No match — create proposed skill
        const proposed = await prisma.skill.create({
            data: {
                name: text.trim(),
                enabled: true,
                isProposed: true,
                proposedBy: req.user.id,
            },
        });

        res.json({ matched: false, proposed: true, skill: { id: proposed.id, name: proposed.name } });
    } catch (error) {
        if (error.code === 'P2002') {
            // Skill name already exists — find and return it
            const existing = await prisma.skill.findFirst({
                where: { name: { equals: req.body.text.trim() } },
            });
            if (existing) {
                return res.json({ matched: true, skill: { id: existing.id, name: existing.name } });
            }
        }
        console.error('Skill resolve error:', error);
        res.status(500).json({ error: 'Failed to resolve skill' });
    }
});

// GET /api/coaches/my-status — Get own coach application status
router.get('/my-status', authenticate, async (req, res) => {
    try {
        const profile = await prisma.coachProfile.findUnique({
            where: { userId: req.user.id },
            include: { skills: { include: { skill: true } } },
        });

        if (!profile) {
            return res.json({ hasProfile: false, profile: null });
        }

        res.json({ hasProfile: true, profile });
    } catch (error) {
        console.error('Coach status error:', error);
        res.status(500).json({ error: 'Failed to fetch coach status' });
    }
});

// GET /api/coaches/slug/:slug — Coach profile by slug (public, must be approved)
router.get('/slug/:slug', optionalAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { slug: req.params.slug },
            select: {
                id: true, name: true, slug: true, avatar: true, createdAt: true,
                emailVerified: true,
                coachProfile: {
                    include: { skills: { include: { skill: true } } },
                },
            },
        });

        if (!user || !user.coachProfile || user.coachProfile.status !== 'APPROVED') {
            return res.status(404).json({ error: 'Coach not found' });
        }

        track.coachProfileViewed(req.params.slug, req.user?.id);

        res.json({ coach: user });
    } catch (error) {
        console.error('Coach by slug error:', error);
        res.status(500).json({ error: 'Failed to fetch coach' });
    }
});

// POST /api/coaches/apply — Submit/update coach application
router.post('/apply', authenticate, async (req, res) => {
    try {
        const {
            headline, bio, skillId, sessionMode, suburb, state, postcode,
            lat, lng, serviceRadius, hourlyRate, yearsExp, certifications,
            linkedinUrl, phone, email, availability,
        } = req.body;

        // Ensure user is flagged as coach
        if (!req.user.isCoach) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: { isCoach: true },
            });
        }

        const profileData = {
            headline: headline || '',
            bio: bio || '',
            sessionMode: sessionMode || 'BOTH',
            suburb: suburb || '',
            state: state || '',
            postcode: postcode || '',
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            serviceRadius: serviceRadius || '',
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 0,
            yearsExp: yearsExp ? parseInt(yearsExp) : 0,
            certifications: certifications || '',
            linkedinUrl: linkedinUrl || '',
            phone: phone || '',
            email: email || req.user.email,
            availability: availability || '[]',
            status: 'PENDING',
        };

        let profile = await prisma.coachProfile.findUnique({
            where: { userId: req.user.id },
        });

        if (profile) {
            // Only allow update if draft or pending
            if (!['DRAFT', 'PENDING', 'REJECTED'].includes(profile.status)) {
                return res.status(400).json({ error: 'Cannot update an approved/suspended application' });
            }
            profile = await prisma.coachProfile.update({
                where: { userId: req.user.id },
                data: profileData,
                include: { skills: { include: { skill: true } } },
            });
        } else {
            profile = await prisma.coachProfile.create({
                data: {
                    userId: req.user.id,
                    ...profileData,
                },
                include: { skills: { include: { skill: true } } },
            });
        }

        // Handle skill association
        if (skillId) {
            // Remove existing skills
            await prisma.coachSkill.deleteMany({
                where: { coachProfileId: profile.id },
            });

            // Add new skill(s) — support single or array
            const skillIds = Array.isArray(skillId) ? skillId : [skillId];
            for (const sId of skillIds) {
                const skillExists = await prisma.skill.findUnique({ where: { id: sId } });
                if (skillExists) {
                    await prisma.coachSkill.create({
                        data: { coachProfileId: profile.id, skillId: sId },
                    });
                }
            }

            // Refetch with skills
            profile = await prisma.coachProfile.findUnique({
                where: { id: profile.id },
                include: { skills: { include: { skill: true } } },
            });
        }

        track.coachApplicationSubmitted(req.user.id, profile.id);

        // Notify admin
        sendNewApplicationNotification(req.user.name, req.user.email).catch(() => {});

        res.json({ profile });
    } catch (error) {
        console.error('Coach apply error:', error);
        res.status(500).json({ error: 'Failed to submit coach application' });
    }
});

// PUT /api/coaches/profile — Update own approved coach profile (split-save)
router.put('/profile', authenticate, async (req, res) => {
    try {
        const profile = await prisma.coachProfile.findUnique({
            where: { userId: req.user.id },
            include: { skills: { include: { skill: true } } },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        const { validateFields } = require('../utils/moderation');

        // Define which fields are instant-save (low-risk) vs pending-review (sensitive)
        const INSTANT_FIELDS = [
            'availability', 'suburb', 'state', 'postcode', 'lat', 'lng',
            'sessionMode', 'hourlyRate', 'serviceRadius', 'phone', 'email', 'yearsExp',
        ];
        const SENSITIVE_FIELDS = ['headline', 'bio', 'certifications', 'linkedinUrl'];

        const {
            headline, bio, sessionMode, suburb, state, postcode,
            lat, lng, serviceRadius, hourlyRate, yearsExp, certifications,
            linkedinUrl, phone, email, availability, skillId,
        } = req.body;

        // Collect all incoming fields
        const allFields = {
            headline, bio, sessionMode, suburb, state, postcode,
            lat, lng, serviceRadius, hourlyRate, yearsExp, certifications,
            linkedinUrl, phone, email, availability,
        };

        // Validate sensitive fields
        const sensitiveToValidate = {};
        for (const f of SENSITIVE_FIELDS) {
            if (allFields[f] !== undefined) sensitiveToValidate[f] = allFields[f];
        }
        if (Object.keys(sensitiveToValidate).length > 0) {
            const validation = validateFields(sensitiveToValidate);
            if (!validation.valid) {
                return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
            }
        }

        // 1. Apply instant-save fields directly
        const instantUpdate = {};
        for (const f of INSTANT_FIELDS) {
            if (allFields[f] !== undefined) {
                if (['lat', 'lng'].includes(f)) {
                    instantUpdate[f] = allFields[f] !== null ? parseFloat(allFields[f]) : null;
                } else if (f === 'hourlyRate') {
                    instantUpdate[f] = parseFloat(allFields[f]);
                } else if (f === 'yearsExp') {
                    instantUpdate[f] = parseInt(allFields[f]) || 0;
                } else {
                    instantUpdate[f] = allFields[f];
                }
            }
        }

        let updated = profile;
        if (Object.keys(instantUpdate).length > 0) {
            updated = await prisma.coachProfile.update({
                where: { userId: req.user.id },
                data: instantUpdate,
                include: { skills: { include: { skill: true } } },
            });
        }

        // Handle skill update (instant for existing canonical skills)
        if (skillId !== undefined) {
            await prisma.coachSkill.deleteMany({
                where: { coachProfileId: updated.id },
            });

            const skillIds = Array.isArray(skillId) ? skillId : [skillId];
            for (const sId of skillIds) {
                if (!sId) continue;
                const skillExists = await prisma.skill.findUnique({ where: { id: sId } });
                if (skillExists) {
                    await prisma.coachSkill.create({
                        data: { coachProfileId: updated.id, skillId: sId },
                    });
                }
            }

            updated = await prisma.coachProfile.findUnique({
                where: { id: updated.id },
                include: { skills: { include: { skill: true } } },
            });
        }

        // 2. Check for sensitive field changes — create pending edit if any differ from live
        const sensitiveChanges = {};
        let hasSensitiveChanges = false;
        for (const f of SENSITIVE_FIELDS) {
            if (allFields[f] !== undefined && allFields[f] !== profile[f]) {
                sensitiveChanges[f] = allFields[f];
                hasSensitiveChanges = true;
            }
        }

        let pendingEdit = null;
        if (hasSensitiveChanges) {
            // Cancel any existing pending edit
            await prisma.pendingProfileEdit.updateMany({
                where: { coachProfileId: profile.id, status: 'PENDING' },
                data: { status: 'SUPERSEDED' },
            });

            // Create new pending edit
            pendingEdit = await prisma.pendingProfileEdit.create({
                data: {
                    coachProfileId: profile.id,
                    changes: JSON.stringify(sensitiveChanges),
                },
            });
        }

        res.json({
            profile: updated,
            pendingEdit: pendingEdit ? {
                id: pendingEdit.id,
                changes: sensitiveChanges,
                status: pendingEdit.status,
                createdAt: pendingEdit.createdAt,
            } : null,
            instantFields: Object.keys(instantUpdate),
            pendingFields: Object.keys(sensitiveChanges),
            message: hasSensitiveChanges
                ? 'Some changes saved instantly. Public-facing changes have been submitted for review.'
                : 'Profile updated successfully.',
        });
    } catch (error) {
        console.error('Update coach profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// GET /api/coaches/my-pending-edits — Get active pending edits for current coach
router.get('/my-pending-edits', authenticate, async (req, res) => {
    try {
        const profile = await prisma.coachProfile.findUnique({
            where: { userId: req.user.id },
        });

        if (!profile) {
            return res.json({ pendingEdits: [] });
        }

        const pendingEdits = await prisma.pendingProfileEdit.findMany({
            where: { coachProfileId: profile.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        const formatted = pendingEdits.map(pe => ({
            ...pe,
            changes: JSON.parse(pe.changes || '{}'),
        }));

        res.json({ pendingEdits: formatted });
    } catch (error) {
        console.error('Get pending edits error:', error);
        res.status(500).json({ error: 'Failed to fetch pending edits' });
    }
});

module.exports = router;
