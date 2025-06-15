const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite DB', err);
    } else {
        console.log('Connected to SQLite DB');
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        ai_reply TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
        );`,
    ];
    db.run(initQueries[0], (err) => {
        if (err) {
            console.error('Failed to create users table', err);
        } else {
            console.log('Users table created');
            db.run(initQueries[1], (err) => {
                if (err) {
                    console.error('Failed to create messages table', err);
                } else {
                    console.log('Messages table created');
                    cb();
                }
            });
        }
    });
}

module.exports = { db, init };