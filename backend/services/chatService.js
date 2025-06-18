const { db } = require('../utils/db');

function ChatService() {
    const SELF = {}
    return {
        createConversation: async (userId) => {
            return new Promise((resolve, reject) => {
                db.run('INSERT INTO conversations (user_id) VALUES (?)', [userId], function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
            })
        },
        saveMessage: async (userId, content, aiReply, conversationId) => {
            return new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO messages (user_id, content, ai_reply, conversation_id) VALUES (?, ?, ?, ?)',
                    [userId, content, aiReply, conversationId],
                    function (err) {
                        if (err) return reject(err);
                        resolve({ id: this.lastID, content, ai_reply: aiReply });
                    }
                );
            });
        },
        getMessagesByConversation: async (conversationId) => {
            return new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
                    [conversationId],
                    (err, rows) => {
                        if (err) return reject(err);
                        resolve(rows);
                    }
                );
            });
        },
        getConversationByUser: async (userId) => {
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM conversations WHERE user_id = ?', [userId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });
        }
    }
}

module.exports = ChatService(); 