const { db } = require('../utils/db');

function ChatService() {
    const SELF = {}
    return {
        createConversation: async (userId) => {
            /**
             * Creates a new conversation for the given user and returns the full
             * conversation object { id, user_id, title }.
             */
            return new Promise((resolve, reject) => {
                db.run('INSERT INTO conversations (user_id) VALUES (?)', [userId], function (err) {
                    if (err) return reject(err);
                    // `this` refers to the statement context where lastID is the inserted row id
                    const newId = this.lastID;
                    db.get('SELECT * FROM conversations WHERE id = ?', [newId], (err, row) => {
                        if (err) return reject(err);
                        resolve(row);
                    });
                });
            });
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
            /**
             * Returns an array of conversations that belong to the user.
             */
            return new Promise((resolve, reject) => {
                db.all('SELECT * FROM conversations WHERE user_id = ? ORDER BY id DESC', [userId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });
        }
    }
}

module.exports = ChatService(); 