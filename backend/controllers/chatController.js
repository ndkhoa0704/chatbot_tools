const chatService = require('../services/chatService');
const OpenAI = require('openai');

function ChatController() {
    const SELF = {
        fn: {
            getAIReply: async (message) => {
                console.log(SELF.var.model)
                const completion = await SELF.var.client.chat.completions.create({
                    model: SELF.var.model,
                    messages: [
                        { role: 'specialist', content: message },
                        // { role: 'user', content: 'Are semicolons optional in JavaScript?' },
                    ],
                });

                console.log(completion.choices[0].message.content);
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
        // This is mock AI reply; replace with real integration later

        chat: async (req, res) => {
            const { message } = req.body;
            if (!message) return res.status(400).json({ message: 'Message is required' });

            const aiReply = SELF.fn.getAIReply(message);
            console.log(aiReply);
            try {
                const saved = await chatService.saveMessage(req.user.id, message, aiReply);
                res.json(saved);
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        },
        history: async (req, res) => {
            try {
                const rows = await chatService.getMessagesByUser(req.user.id);
                res.json(rows);
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Database error' });
            }
        }
    }
}

module.exports = ChatController(); 