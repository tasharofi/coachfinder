const express = require('express');
const { authenticate } = require('../middleware/auth');
const AIService = require('../utils/ai-service');

const router = express.Router();

// GET /api/ai/status — Check if AI is available
router.get('/status', (req, res) => {
    res.json({ available: AIService.isEnabled() });
});

// POST /api/ai/parse-search — Parse natural-language search query
router.post('/parse-search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || query.trim().length < 5) {
            return res.json({ parsed: false, reason: 'Query too short' });
        }

        if (!AIService.isEnabled()) {
            return res.json({ parsed: false, reason: 'AI not available' });
        }

        const result = await AIService.parseLearnerSearchQuery(query);

        if (!result || !result.skillQuery) {
            return res.json({ parsed: false, reason: 'Could not parse query' });
        }

        // Map sessionMode values to our enum
        let sessionMode = null;
        if (result.sessionMode === 'online') sessionMode = 'ONLINE';
        else if (result.sessionMode === 'in_person') sessionMode = 'IN_PERSON';

        // Map availability
        let availability = null;
        if (result.availability) {
            const avMap = { weekday: 'weekdays', weekend: 'weekends', morning: 'weekdays', afternoon: 'weekdays', evening: 'evenings' };
            availability = avMap[result.availability] || null;
        }

        res.json({
            parsed: true,
            skillQuery: result.skillQuery,
            locationQuery: result.locationQuery || null,
            sessionMode,
            level: result.level || null,
            availability,
            priceIntent: result.priceIntent || null,
        });
    } catch (error) {
        console.error('AI parse search error:', error);
        res.json({ parsed: false, reason: 'AI error' });
    }
});

// POST /api/ai/improve-bio — Improve coach bio text
router.post('/improve-bio', authenticate, async (req, res) => {
    try {
        const { text, context } = req.body;
        if (!text || text.trim().length < 10) {
            return res.status(400).json({ error: 'Please write at least a rough bio first' });
        }

        if (!AIService.isEnabled()) {
            return res.json({ available: false, suggestion: null });
        }

        const suggestion = await AIService.improveCoachBio(text, context || {});

        if (!suggestion) {
            return res.json({ available: true, suggestion: null });
        }

        res.json({ available: true, suggestion });
    } catch (error) {
        console.error('AI improve bio error:', error);
        res.json({ available: false, suggestion: null });
    }
});

// POST /api/ai/improve-headline — Generate headline options
router.post('/improve-headline', authenticate, async (req, res) => {
    try {
        const { text, context } = req.body;
        if (!text || text.trim().length < 3) {
            return res.status(400).json({ error: 'Please write at least a rough headline first' });
        }

        if (!AIService.isEnabled()) {
            return res.json({ available: false, suggestions: null });
        }

        const suggestions = await AIService.improveCoachHeadline(text, context || {});

        if (!suggestions || !Array.isArray(suggestions)) {
            return res.json({ available: true, suggestions: null });
        }

        res.json({ available: true, suggestions: suggestions.slice(0, 5) });
    } catch (error) {
        console.error('AI improve headline error:', error);
        res.json({ available: false, suggestions: null });
    }
});

// POST /api/ai/suggest-skills — Suggest skills based on profile
router.post('/suggest-skills', authenticate, async (req, res) => {
    try {
        const { context } = req.body;

        if (!AIService.isEnabled()) {
            return res.json({ available: false, suggestions: null });
        }

        const suggestions = await AIService.suggestCoachSkillTags(context || {});

        if (!suggestions || !Array.isArray(suggestions)) {
            return res.json({ available: true, suggestions: null });
        }

        res.json({ available: true, suggestions: suggestions.slice(0, 6) });
    } catch (error) {
        console.error('AI suggest skills error:', error);
        res.json({ available: false, suggestions: null });
    }
});

// POST /api/ai/normalise-skill — Normalise a coach skill entry
router.post('/normalise-skill', authenticate, async (req, res) => {
    try {
        const { input, existingSkills } = req.body;
        if (!input || input.trim().length < 2) {
            return res.status(400).json({ error: 'Skill input required' });
        }

        if (!AIService.isEnabled()) {
            return res.json({ available: false, result: null });
        }

        const result = await AIService.normaliseCoachSkill(input, existingSkills || []);

        if (!result) {
            return res.json({ available: true, result: null });
        }

        res.json({ available: true, result });
    } catch (error) {
        console.error('AI normalise skill error:', error);
        res.json({ available: false, result: null });
    }
});

module.exports = router;
