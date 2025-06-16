const logger = require('../utils/logger');

module.exports = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        logger.info(`${req.method} ${req.url} - ${ms}ms - ${res.statusCode}`);
    });
    next();
}
