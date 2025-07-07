const chatService = require('../services/chatService');
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { db } = require('../utils/db');
const prompts = require('../prompts');
const { v4: uuidv4 } = require('uuid');
const tools = require('../tools');

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
                tools: Object.values(tools),
                tool_choice: "auto",
                stream: true,
            });

            const messageResponse = response.choices?.[0]?.message;

            // Check if the model wants to call a tool
            console.log('tool_calls', messageResponse.tool_calls)
            if (messageResponse.tool_calls && messageResponse.tool_calls.length > 0) {
                const toolCall = messageResponse.tool_calls[0];
                const tool = tools[toolCall.function.name];
                if (tool) {
                    const args = JSON.parse(toolCall.function.arguments);
                    const searchResults = await tool.execute(args);

                    // Send the tool results back to the model
                    const secondResponse = await SELF.client.chat.completions.create({
                        model: SELF.model,
                        messages: [
                            { role: "system", content: prompts.perplexity },
                            { role: "user", content: message },
                            { role: "assistant", content: null, tool_calls: [toolCall] },
                            { role: "tool", content: JSON.stringify(searchResults), tool_call_id: toolCall.id }
                        ],
                        temperature: 0.7,
                    });
                    return secondResponse.choices?.[0]?.message?.content?.trim();
                }
            }

            return messageResponse?.content?.trim();
        },
    }

    return {
        createConversation: async (req, res) => {
            try {
                const conversation = await chatService.createConversation(uuidv4(), req.user.id);
                console.log('conversation', conversation)
                res.json({ msg: 'success', data: conversation });
            } catch (err) {
                logger.error(`ChatController.createConversation - ${err.stack}`);
                res.status(500).json({ message: 'Database error' });
            }
        },
        chat: async (req, res) => {
            let { message, conversationId, hasNoMsg } = req.body;
            try {
                if (!message) return res.status(400).json({ message: 'Message is required' });

                // When no conversation provided, create one implicitly
                if (!conversationId) {
                    return res.status(400).json({ message: 'Conversation ID is required' });
                }

                const chatId = uuidv4();

                // Setup Server-Sent Events headers to begin streaming
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                });
                if (typeof res.flushHeaders === 'function') res.flushHeaders();

                // Helper to send SSE formatted data
                const sendData = (data) => {
                    try {
                        res.write(`data: ${data}\n\n`);
                    } catch (e) {
                        logger.error(`ChatController.chat - streaming error: ${e.message}`);
                    }
                };

                let aiReply = '';
                try {
                    const stream = await SELF.client.chat.completions.create({
                        model: SELF.model,
                        messages: [
                            { role: 'system', content: prompts.perplexity },
                            { role: 'user', content: message },
                        ],
                        temperature: 0.7,
                        tools: Object.values(tools),
                        tool_choice: 'auto',
                        stream: true,
                    });

                    // Collect any tool calls that appear in the streamed deltas
                    const collectedToolCalls = [];

                    for await (const chunk of stream) {
                        const delta = chunk.choices?.[0]?.delta || {};

                        // Stream normal assistant content
                        if (delta.content) {
                            aiReply += delta.content;
                            sendData(JSON.stringify(delta.content));
                        }

                        // Buffer tool call information for later use (OpenAI may send this piecemeal)
                        if (delta.tool_calls) {
                            collectedToolCalls.push(...delta.tool_calls);
                        }
                    }

                    // Signal the end of the first assistant streaming phase
                    sendData('[DONE]');
                    console.log('collectedToolCalls', collectedToolCalls)
                    // If the assistant requested a tool, execute it and send back a follow-up answer
                    if (collectedToolCalls.length > 0) {
                        const toolCall = collectedToolCalls[0]; // Hiện tại chỉ hỗ trợ 1 tool call
                        const toolImpl = tools[toolCall.function.name];
                        if (toolImpl) {
                            let parsedArgs = {};
                            try { parsedArgs = JSON.parse(toolCall.function.arguments || '{}'); } catch (_) {}

                            // Thực thi tool
                            const toolResult = await toolImpl.execute(parsedArgs);

                            // Gọi lại model cùng kết quả tool và stream câu trả lời kế tiếp
                            const followStream = await SELF.client.chat.completions.create({
                                model: SELF.model,
                                messages: [
                                    { role: 'system', content: prompts.perplexity },
                                    { role: 'user', content: message },
                                    { role: 'assistant', content: null, tool_calls: collectedToolCalls },
                                    { role: 'tool', content: JSON.stringify(toolResult), tool_call_id: toolCall.id },
                                ],
                                temperature: 0.7,
                                stream: true,
                            });

                            for await (const chunk of followStream) {
                                const delta = chunk.choices?.[0]?.delta || {};
                                if (delta.content) {
                                    aiReply += delta.content;
                                    sendData(JSON.stringify(delta.content));
                                }
                            }

                            // Đánh dấu hoàn tất giai đoạn thứ 2
                            sendData('[DONE]');
                        }
                    }

                    res.end();
                } catch (streamErr) {
                    // If OpenAI streaming fails, notify client and log the error
                    logger.error(`ChatController.chat - stream error: ${streamErr.stack}`);
                    sendData('[ERROR]');
                    return res.end();
                }

                // Persist the full message once streaming is finished
                await chatService.saveMessage(chatId, req.user.id, message, aiReply, conversationId);
            } catch (err) {
                logger.error(`ChatController.chat - ${err.stack}`);
                // If headers not sent yet, we can still send a JSON error response
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Database error' });
                } else {
                    // Otherwise, attempt to stream an error flag and terminate connection
                    try {
                        res.write('data: [ERROR]\n\n');
                    } catch (_) { /* ignore */ }
                    res.end();
                }
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