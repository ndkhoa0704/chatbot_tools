const db = require('../utils/db');

function saveMessage(userId, content, aiReply) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO messages (user_id, content, ai_reply) VALUES (?, ?, ?)',
      [userId, content, aiReply],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, content, ai_reply: aiReply });
      }
    );
  });
}

function getMessagesByUser(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY timestamp ASC',
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

module.exports = { saveMessage, getMessagesByUser }; 