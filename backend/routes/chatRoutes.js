const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../utils/auth');

router.post('/chat', authenticateToken, ChatController.chat);
router.get('/conversation/message', authenticateToken, ChatController.getMessagesByConversation);
router.get('/conversation', authenticateToken, ChatController.getConversationByUser);
router.post('/conversation', authenticateToken, ChatController.createConversation);

module.exports = router; 