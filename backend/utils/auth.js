const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

function authenticateToken(req, res, next) {
    // Try to get token from HttpOnly cookie first, then fallback to Authorization header
    let token = req.cookies?.token;

    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        UserService.getUserByUsername(user.username).then(user => {
            req.user = user;
            next();
        }).catch(err => {
            logger.error('Error getting user by username', err);
            res.sendStatus(403);
        });
    });
}

module.exports = { authenticateToken, JWT_SECRET }; 