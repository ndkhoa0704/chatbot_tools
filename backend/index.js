require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const UserService = require('./services/userService');
const { init } = require('./utils/db');
const path = require('path');
const sanitizeInput = require('./middlewares/sanitizeInput');
const logRequest = require('./middlewares/logRequest');
const logger = require('./utils/logger');

const app = express();

// Allow credentials (cookies) and specify allowed origin

// Security middleware with CSP configuration for Vue.js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://unpkg.com",
                "https://cdn.tailwindcss.com",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.tailwindcss.com",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com"
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(cors({
    origin: true, // Allow dynamic origin or set specific domain e.g. 'http://localhost:5173'
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
}
app.use(sanitizeInput);
app.use(logRequest);

// Mount routers
app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/webhook', webhookRoutes);

// Fallback route to support client-side routing (e.g., /chat)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT} (IPv4)`);
    init(() => {
        UserService.ensureDefaultUser();
    });
});