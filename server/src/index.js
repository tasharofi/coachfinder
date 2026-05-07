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

// CORS — allow localhost, configured FRONTEND_URL, and all Vercel preview URLs
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) return callback(null, true);

        const isLocalhost = origin.startsWith('http://localhost');
        const isVercel = origin.endsWith('.vercel.app');
        const isFrontend = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

        if (isLocalhost || isVercel || isFrontend) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
}));

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
