const chatService = require('../services/chatService');
const OpenAI = require('openai');
const logger = require('../utils/logger');


function ChatController() {
    const SELF = {
        fn: {
            // getAIReply: async (message) => {
            //     logger.info(SELF.var.model)
            //     const completion = await SELF.var.client.chat.completions.create({
            //         model: SELF.var.model,
            //         messages: [
            //             { role: 'assistant', content: message },
            //         ],
            //     });
            //     return completion.choices[0].message.content;
            // }
            getAIReply: async (message) => {
                return "This is a mock AI reply";
            }
        },
        var: {
            client: new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            }),
            model: "gpt-4.1",
        }
    }
    return {
        // This is mock AI reply; replace with real integration later
        createConversation: async (req, res) => {
            try {
                const conversation = await chatService.createConversation(req.user.id);
                res.json({msg: 'success', data: conversation});
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        },
        chat: async (req, res) => {
            const { message } = req.body;
            if (!message) return res.status(400).json({ message: 'Message is required' });
            const aiReply = await SELF.fn.getAIReply(message);
            try {
                const saved = await chatService.saveMessage(req.user.id, message, aiReply);
                return res.json({msg: 'success', data: saved});
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        },
        getMessagesByConversation: async (req, res) => {
            try {
                const { conversationId } = req.query;
                const rows = await chatService.getMessagesByConversation(conversationId);
                res.json({msg: 'success', data: rows});
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        },
        getConversationByUser: async (req, res) => {
            try {
                const { userId } = req.query;
                const rows = await chatService.getConversationByUser(userId);
                res.json({msg: 'success', data: rows});
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        }
    }
}

module.exports = ChatController(); 