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

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suburbs', suburbRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);

// File upload endpoint
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeValid = allowed.test(file.mimetype);
        cb(null, extValid && mimeValid);
    },
});

app.post('/api/upload', require('./middleware/auth').authenticate, upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No valid image file provided' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
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
    console.log(`CoachFinder API running on http://localhost:${PORT}`);
});
