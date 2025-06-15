const bcrypt = require('bcrypt');
const db = require('../utils/db');

const DEFAULT_USER = process.env.DEFAULT_USER || 'admin';
const DEFAULT_PASS = process.env.DEFAULT_PASS || 'password';

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function createUser(username, password) {
  const hash = await bcrypt.hash(password, 10);
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function (err) {
      if (err) return reject(err);
      // return inserted user with id
      resolve({ id: this.lastID, username });
    });
  });
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

async function ensureDefaultUser() {
  try {
    const user = await getUserByUsername(DEFAULT_USER);
    if (!user) {
      await createUser(DEFAULT_USER, DEFAULT_PASS);
      console.log(`Default user "${DEFAULT_USER}" created with password "${DEFAULT_PASS}"`);
    }
  } catch (err) {
    console.error('Error ensuring default user', err);
  }
}

// Run immediately on import
ensureDefaultUser();

module.exports = { getUserByUsername, createUser, verifyPassword }; 