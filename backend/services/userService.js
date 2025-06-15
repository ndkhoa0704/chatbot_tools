const bcrypt = require('bcrypt');
const db = require('../utils/db');

const DEFAULT_USER = process.env.DEFAULT_USER || 'admin';
const DEFAULT_PASS = process.env.DEFAULT_PASS || 'password';

function UserService() {
    const SELF = {}
    return {
        getUserByUsername: (username) => {
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                });
            })
        },
        createUser: async (username, password) => {
            const hash = await bcrypt.hash(password, 10);
            return new Promise((resolve, reject) => {
                db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function (err) {
                    if (err) return reject(err);
                    // return inserted user with id
                    resolve({ id: this.lastID, username });
                });
            });
        },
        ensureDefaultUser: async () => {
            try {
                const user = await module.exports.getUserByUsername(DEFAULT_USER);
                if (!user) {
                    await module.exports.createUser(DEFAULT_USER, DEFAULT_PASS);
                    console.log(`Default user "${DEFAULT_USER}" created with password "${DEFAULT_PASS}"`);
                }
            } catch (err) {
                console.error('Error ensuring default user', err);
            }
        },
        verifyPassword: async (password, passwordHash) => {
            return bcrypt.compare(password, passwordHash);
        }
    }
}

module.exports = UserService();