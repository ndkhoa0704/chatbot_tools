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
        },
        deleteConversation: async (conversationId, userId) => {
            /**
             * Deletes a conversation that belongs to the given user along with all of its messages.
             * If the conversation does not belong to the user, no rows will be removed and the promise resolves false.
             */
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    // Ensure the conversation belongs to the user first
                    db.get('SELECT id FROM conversations WHERE id = ? AND user_id = ?', [conversationId, userId], (err, row) => {
                        if (err) return reject(err);
                        if (!row) return resolve(false); // not found or not owned by user

                        // wrap deletes in a transaction for consistency
                        db.run('BEGIN TRANSACTION');
                        db.run('DELETE FROM messages WHERE conversation_id = ?', [conversationId], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return reject(err);
                            }
                            db.run('DELETE FROM conversations WHERE id = ? AND user_id = ?', [conversationId, userId], (err2) => {
                                if (err2) {
                                    db.run('ROLLBACK');
                                    return reject(err2);
                                }
                                db.run('COMMIT');
                                resolve(true);
                            });
                        });
                    });
                });
            });
        }
    }
}

module.exports = ChatService(); 