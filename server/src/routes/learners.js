const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/learners/profile — View own learner info
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, name: true, slug: true, avatar: true, email: true,
                isLearner: true, isCoach: true, emailVerified: true,
                coachProfile: { select: { id: true, status: true } },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get learner profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

module.exports = router;
