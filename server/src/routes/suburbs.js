const express = require('express');
const { searchSuburbs, findNearbySuburbs } = require('../utils/suburbs-data');

const router = express.Router();

// GET /api/suburbs/search?q=... — Autocomplete suburb search
router.get('/search', (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q || q.length < 2) {
            return res.json({ suburbs: [] });
        }

        const results = searchSuburbs(q, parseInt(limit) || 10);
        res.json({ suburbs: results });
    } catch (error) {
        console.error('Suburb search error:', error);
        res.status(500).json({ error: 'Suburb search failed' });
    }
});

// GET /api/suburbs/nearby?suburb=...&state=...&radius=... — Nearby suburbs
router.get('/nearby', (req, res) => {
    try {
        const { suburb, state, radius } = req.query;
        if (!suburb) {
            return res.json({ suburbs: [] });
        }

        const radiusKm = parseFloat(radius) || 10;
        const results = findNearbySuburbs(suburb, state, radiusKm);
        res.json({ suburbs: results });
    } catch (error) {
        console.error('Nearby suburbs error:', error);
        res.status(500).json({ error: 'Nearby suburb search failed' });
    }
});

module.exports = router;
