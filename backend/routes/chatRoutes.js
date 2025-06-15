const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../utils/auth');

router.post('/chat', authenticateToken, chatController.chat);
router.get('/history', authenticateToken, chatController.history);

module.exports = router; 