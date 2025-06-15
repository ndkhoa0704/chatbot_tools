const chatService = require('../services/chatService');

// This is mock AI reply; replace with real integration later
function getAIReply(message) {
    return `AI says: ${message}`;
}

async function chat(req, res) {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const aiReply = getAIReply(message);
    try {
        const saved = await chatService.saveMessage(req.user.id, message, aiReply);
        res.json(saved);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
};

async function history(req, res) {
    try {
        const rows = await chatService.getMessagesByUser(req.user.id);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
}

module.exports = { chat, history }; 