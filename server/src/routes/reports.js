const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');
const { validateFields } = require('../utils/moderation');

const router = express.Router();

const VALID_REASONS = [
    'inappropriate',
    'misleading',
    'spam',
    'offensive_image',
    'wrong_skill',
];

const REASON_LABELS = {
    inappropriate: 'Inappropriate content',
    misleading: 'Misleading information',
    spam: 'Spam / scam',
    offensive_image: 'Offensive image',
    wrong_skill: 'Wrong skill / category',
};

// POST /api/reports — Submit a profile report
router.post('/', authenticate, async (req, res) => {
    try {
        const { coachProfileId, reason, details } = req.body;

        if (!coachProfileId || !reason) {
            return res.status(400).json({ error: 'Coach profile ID and reason are required' });
        }

        if (!VALID_REASONS.includes(reason)) {
            return res.status(400).json({ error: 'Invalid report reason' });
        }

        // Validate details text if provided
        if (details) {
            const validation = validateFields({ details });
            if (!validation.valid) {
                return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
            }
        }

        // Verify coach profile exists
        const profile = await prisma.coachProfile.findUnique({
            where: { id: coachProfileId },
        });
        if (!profile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        // Prevent self-reporting
        if (profile.userId === req.user.id) {
            return res.status(400).json({ error: 'You cannot report your own profile' });
        }

        // Check for duplicate recent report from same user
        const existingReport = await prisma.profileReport.findFirst({
            where: {
                coachProfileId,
                reporterUserId: req.user.id,
                status: 'NEW',
            },
        });
        if (existingReport) {
            return res.status(400).json({ error: 'You have already reported this profile' });
        }

        const report = await prisma.profileReport.create({
            data: {
                coachProfileId,
                reporterUserId: req.user.id,
                reason,
                details: details || '',
            },
        });

        res.status(201).json({
            report,
            message: 'Report submitted successfully. Our team will review it.',
        });
    } catch (error) {
        console.error('Submit report error:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

module.exports = router;
module.exports.REASON_LABELS = REASON_LABELS;
