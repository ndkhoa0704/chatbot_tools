const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('token', token);
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        UserService.getUserByUsername(user.username).then(user => {
            req.user = user;
            next();
        }).catch(err => {
            console.error('Error getting user by username', err);
            res.sendStatus(403);
        });
    });
}

module.exports = { authenticateToken, JWT_SECRET }; 