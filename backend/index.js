require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const UserService = require('./services/userService');
const { init } = require('./utils/db');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.static(path.join(__dirname, '../public')));

// Mount routers
app.use('/api', authRoutes);
app.use('/api', chatRoutes);

// Fallback route to support client-side routing (e.g., /chat)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    init(() => {
        UserService.ensureDefaultUser();
    });
}); 