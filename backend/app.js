require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api', authRoutes);
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 