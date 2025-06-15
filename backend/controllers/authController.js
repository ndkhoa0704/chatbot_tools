const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const { JWT_SECRET } = require('../utils/auth');

module.exports = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    try {
        const user = await userService.getUserByUsername(username);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const valid = await userService.verifyPassword(password, user.password_hash);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}; 