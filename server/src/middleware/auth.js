const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true, email: true, name: true, slug: true, avatar: true,
                isLearner: true, isCoach: true, isAdmin: true,
                emailVerified: true, phone: true, suspended: true,
                coachProfile: {
                    select: { id: true, status: true },
                },
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.suspended) {
            return res.status(403).json({ error: 'Account suspended' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Optional auth — sets req.user if token present, continues without error if not
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true, email: true, name: true, slug: true, avatar: true,
                isLearner: true, isCoach: true, isAdmin: true,
                emailVerified: true, suspended: true,
            },
        });

        req.user = user && !user.suspended ? user : null;
        next();
    } catch {
        req.user = null;
        next();
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const requireApprovedCoach = (req, res, next) => {
    if (!req.user || !req.user.isCoach || req.user.coachProfile?.status !== 'APPROVED') {
        return res.status(403).json({ error: 'Approved coach access required' });
    }
    next();
};

module.exports = { authenticate, optionalAuth, requireAdmin, requireApprovedCoach };
