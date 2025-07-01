const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Failed to connect to SQLite DB', err);
    } else {
        logger.info('Connected to SQLite DB');
    }
});


function init(cb) {
    // Create tables if they do not exist
    const initQueries = [
        `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        ai_reply TEXT NOT NULL,
        conversation_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        );`,
        `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
        );`,
    ];
    db.run(initQueries[0], (err) => {
        if (err) {
            logger.error('Failed to create users table', err);
        } else {
            logger.info('Users table created');
            db.run(initQueries[1], (err) => {
                if (err) {
                    logger.error('Failed to create messages table', err);
                } else {
                    logger.info('Messages table created');
                    db.run(initQueries[2], (err) => {
                        if (err) {
                            logger.error('Failed to create conversations table', err);
                        } else {
                            logger.info('Conversations table created');
                            cb();
                        }
                    });
                    cb();
                }
            });
        }
    });
}

module.exports = { db, init };