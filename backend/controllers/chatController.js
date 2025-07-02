const chatService = require('../services/chatService');
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { db } = require('../utils/db');
const prompts = require('../prompts');
const { v4: uuidv4 } = require('uuid');
const { webSearch } = require('../tools/searchWeb');

function ChatController() {
    const SELF = {
        client: (() => {
            if (process.env.BASE_LM_URL) {
                return new OpenAI({
                    baseURL: process.env.BASE_LM_URL,
                })
            }
            return new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            })
        })(),
        model: process.env.LM_MODEL || "phi4:latest",
        getAIReply: async (message) => {
            const response = await SELF.client.chat.completions.create({
                model: SELF.model,
                messages: [
                    { role: "system", content: prompts.perplexity },
                    { role: "user", content: message },
                ],
                temperature: 0.7,
                tools: [webSearch],
            });
            return response.choices?.[0]?.message?.content?.trim();
        },
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
                const title = await SELF.getAIReply(instruction);
                db.run('UPDATE conversations SET title = ? WHERE id = ?', [title, conversationId]);
            } catch (err) {
                logger.error(`ChatController.updateConversationTitle - ${err.stack}`);
                res.status(500).json({ message: 'Database error' });
            }
            res.json({ msg: 'success', data: title });
        },
        createConversation: async (req, res) => {
            try {
                const conversation = await chatService.createConversation(uuidv4(), req.user.id);
                res.json({ msg: 'success', data: conversation });
            } catch (err) {
                logger.error(`ChatController.createConversation - ${err.stack}`);
                res.status(500).json({ message: 'Database error' });
            }
        },
        chat: async (req, res) => {
            let { message, conversationId } = req.body;
            try {
                if (!message) return res.status(400).json({ message: 'Message is required' });

                // When no conversation provided, create one implicitly
                if (!conversationId) {
                    try {
                        conversationId = uuidv4()
                        await chatService.createConversation(conversationId, req.user.id);
                    } catch (err) {
                        logger.error(`ChatController.chat - failed to create conversation - ${err.stack}`);
                        return res.status(500).json({ message: 'Database error' });
                    }
                }
                const chatId = uuidv4();
                const aiReply = await SELF.getAIReply(message);
                res.json({
                    msg: 'success',
                    data: {
                        id: chatId,
                        conversationId,
                        ai_reply: aiReply,
                        content: message
                    }
                });
                await chatService.saveMessage(chatId, req.user.id, message, aiReply, conversationId);
            } catch (err) {
                logger.error(`ChatController.chat - ${err.stack}`);
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
        },
        deleteConversation: async (req, res) => {
            try {
                const { id } = req.params;
                const success = await chatService.deleteConversation(id, req.user.id);
                if (!success) return res.status(404).json({ message: 'Conversation not found' });
                res.json({ msg: 'success' });
            } catch (err) {
                logger.error(`ChatController.deleteConversation - ${err.stack}`);
                res.status(500).json({ message: 'Database error' });
            }
        }
    }
}

module.exports = ChatController(); 