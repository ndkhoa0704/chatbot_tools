const chatService = require('../services/chatService');
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { db } = require('../utils/db');


function ChatController() {
    const SELF = {
        fn: {
            getAIReply: async (message) => {
                const completion = await SELF.var.client.chat.completions.create({
                    model: SELF.var.model,
                    messages: [
                        { role: 'assistant', content: message },
                    ],
                });
                return completion.choices[0].message.content;
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
        updateConversationTitle: async (req, res) => {
            const { message, conversationId } = req.body;
            const instruction = `
            You are a helpful assistant that generates a title for a conversation based on the message.
            The title should be a single sentence that captures the essence of the conversation.
            The title should be no more than 10 words.
            The title should be in the same language as the conversation.

            Here is the message:
            ${message}
            `
            try {
                const title = await SELF.fn.getAIReply(instruction);
                db.run('UPDATE conversations SET title = ? WHERE id = ?', [title, conversationId]);
            } catch (err) {
                logger.error('ChatController.updateConversationTitle - ', err.stack);
                res.status(500).json({ message: 'Database error' });
            }
            res.json({ msg: 'success', data: title });
        },
        createConversation: async (req, res) => {
            try {
                const conversation = await chatService.createConversation(req.user.id);
                res.json({ msg: 'success', data: conversation });
            } catch (err) {
                logger.error('ChatController.createConversation - ', err.stack);
                res.status(500).json({ message: 'Database error' });
            }
        },
        chat: async (req, res) => {
            let { message, conversationId } = req.body;
            if (!message) return res.status(400).json({ message: 'Message is required' });

            // When no conversation provided, create one implicitly
            if (!conversationId) {
                try {
                    const newConv = await chatService.createConversation(req.user.id);
                    conversationId = newConv.id;
                } catch (err) {
                    logger.error('ChatController.chat - failed to create conversation', err);
                    return res.status(500).json({ message: 'Database error' });
                }
            }

            const aiReply = await SELF.fn.getAIReply(message);
            try {
                const saved = await chatService.saveMessage(req.user.id, message, aiReply, conversationId);
                return res.json({ msg: 'success', data: { ...saved, conversation_id: conversationId } });
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        },
        getMessagesByConversation: async (req, res) => {
            try {
                const { conversationId } = req.query;
                const rows = await chatService.getMessagesByConversation(conversationId);
                res.json({ msg: 'success', data: rows });
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        },
        getConversationByUser: async (req, res) => {
            try {
                const data = await chatService.getConversationByUser(req.user.id);
                res.json({ msg: 'success', data });
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        }
    }
}

module.exports = ChatController(); 