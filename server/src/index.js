require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const coachRoutes = require('./routes/coaches');
const contactRoutes = require('./routes/contacts');
const adminRoutes = require('./routes/admin');
const suburbRoutes = require('./routes/suburbs');
const reportRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// --------------- CORS Configuration ---------------
// Build the allowed origins list from environment variables
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
];

// Add FRONTEND_URL if configured (e.g. https://coachfinder-indol.vercel.app)
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add any extra origins from ALLOWED_ORIGINS (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
        const trimmed = o.trim();
        if (trimmed) allowedOrigins.push(trimmed);
    });
}

console.log('CORS allowed origins:', allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);

        // Allow any *.vercel.app preview deployment
        if (origin.endsWith('.vercel.app')) return callback(null, true);

        // Allow any localhost origin
        if (origin.startsWith('http://localhost')) return callback(null, true);

        // Allow explicitly listed origins
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // Not allowed — but DON'T throw an error (that blocks preflight)
        // Instead, return false to omit CORS headers and let the browser reject it cleanly
        console.warn(`CORS: blocked origin ${origin}`);
        callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// Handle OPTIONS preflight requests explicitly — must come BEFORE routes
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suburbs', suburbRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);

// File upload endpoint — uses Cloudinary in production, local disk in dev
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeValid = allowed.test(file.mimetype);
        cb(null, extValid && mimeValid);
    },
});

app.post('/api/upload', require('./middleware/auth').authenticate, upload.single('photo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No valid image file provided' });
    }

    try {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            // Production: upload to Cloudinary
            const cloudinary = require('cloudinary').v2;
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });

            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'coachfinder-avatars', resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });

            return res.json({ url: result.secure_url, filename: result.public_id });
        } else {
            // Local dev: save to disk
            const fs = require('fs');
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const ext = path.extname(req.file.originalname);
            const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, req.file.buffer);

            // Serve local uploads in dev
            app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

            return res.json({ url: `/uploads/${filename}`, filename });
        }
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`CoachFinder API running on port ${PORT}`);
});
