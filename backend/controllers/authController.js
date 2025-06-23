const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');
const { JWT_SECRET } = require('../utils/auth');
const logger = require('../utils/logger');


function AuthController() {
    const SELF = {}
    return {
        login: async (req, res) => {
            const { username, password } = req.body;
            console.log(username, password);
            if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

            try {
                const user = await UserService.getUserByUsername(username);
                if (!user) return res.status(401).json({ message: 'Invalid credentials' });

                const valid = await UserService.verifyPassword(password, user.password_hash);
                if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

                const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
                // Store token in HttpOnly cookie for security
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });

                // Respond with token as well (optional)
                res.json({ message: 'Login successful', token });
            } catch (err) {
                logger.error(err);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }
}

module.exports = AuthController(); 