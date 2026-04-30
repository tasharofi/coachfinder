const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');
const { generateSlug, ensureUniqueSlug } = require('../utils/slug');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google — Google sign-in / sign-up
router.post('/google', async (req, res) => {
    try {
        const { credential, intent } = req.body;
        // intent: 'learner' | 'coach' — determines initial path

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            console.error('Google token verification failed:', err.message);
            return res.status(401).json({ error: 'Invalid Google credential' });
        }

        const { sub: googleId, email, name, picture } = payload;

        // Check if user already exists (by googleId or email)
        let user = await prisma.user.findFirst({
            where: { OR: [{ googleId }, { email }] },
            include: {
                coachProfile: { include: { skills: { include: { skill: true } } } },
            },
        });

        if (user) {
            // Update googleId if not set
            if (!user.googleId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId, emailVerified: true, avatar: picture || user.avatar },
                });
            }
        } else {
            // Create new user
            const baseSlug = generateSlug(name || email.split('@')[0]);
            const slug = await ensureUniqueSlug(prisma, baseSlug);

            const isCoachIntent = intent === 'coach';

            user = await prisma.user.create({
                data: {
                    email,
                    googleId,
                    name: name || email.split('@')[0],
                    avatar: picture,
                    slug,
                    isLearner: true, // everyone is a learner by default
                    isCoach: isCoachIntent,
                    emailVerified: true,
                    coachProfile: isCoachIntent ? { create: { status: 'DRAFT', email } } : undefined,
                },
                include: {
                    coachProfile: { include: { skills: { include: { skill: true } } } },
                },
            });
        }

        const token = generateToken(user.id);
        res.json({
            user: {
                id: user.id, email: user.email, name: user.name, slug: user.slug,
                avatar: user.avatar, isLearner: user.isLearner, isCoach: user.isCoach,
                isAdmin: user.isAdmin, emailVerified: user.emailVerified,
                coachProfile: user.coachProfile,
            },
            token,
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

// POST /api/auth/register — Email/password registration (kept for admin)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, intent } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const baseSlug = generateSlug(name);
        const slug = await ensureUniqueSlug(prisma, baseSlug);

        const isCoachIntent = intent === 'coach';

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                slug,
                isLearner: true,
                isCoach: isCoachIntent,
                coachProfile: isCoachIntent ? { create: { status: 'DRAFT', email } } : undefined,
            },
            select: {
                id: true, email: true, name: true, slug: true, avatar: true,
                isLearner: true, isCoach: true, isAdmin: true, emailVerified: true,
                coachProfile: { include: { skills: { include: { skill: true } } } },
            },
        });

        const token = generateToken(user.id);
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login — Email/password login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                coachProfile: { include: { skills: { include: { skill: true } } } },
            },
        });

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.suspended) {
            return res.status(403).json({ error: 'Account suspended' });
        }

        const token = generateToken(user.id);
        res.json({
            user: {
                id: user.id, email: user.email, name: user.name, slug: user.slug,
                avatar: user.avatar, isLearner: user.isLearner, isCoach: user.isCoach,
                isAdmin: user.isAdmin, emailVerified: user.emailVerified,
                coachProfile: user.coachProfile,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me — Current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, email: true, name: true, slug: true, avatar: true,
                isLearner: true, isCoach: true, isAdmin: true,
                emailVerified: true, phone: true,
                coachProfile: {
                    include: { skills: { include: { skill: true } } },
                },
            },
        });
        res.json({ user });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// PUT /api/auth/profile — Update own user-level fields (low-risk, instant save)
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const { validateFields } = require('../utils/moderation');

        // Validate content
        const fieldsToValidate = {};
        if (name !== undefined) fieldsToValidate.name = name;
        if (phone !== undefined) fieldsToValidate.phone = phone;

        const validation = validateFields(fieldsToValidate);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
        }

        const updateData = {};
        if (name !== undefined && name.trim().length >= 2) updateData.name = name.trim();
        if (phone !== undefined) updateData.phone = phone.trim();
        if (avatar !== undefined) updateData.avatar = avatar;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true, email: true, name: true, slug: true, avatar: true,
                isLearner: true, isCoach: true, isAdmin: true,
                emailVerified: true, phone: true,
                coachProfile: {
                    include: { skills: { include: { skill: true } } },
                },
            },
        });

        res.json({ user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
