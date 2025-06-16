// Basic sanitization: remove dangerous SQL characters
function sanitizeString(str) {
    // Remove common SQL injection characters and patterns
    return str
        .replace(/['";\\]/g, '') // Remove quotes, semicolons, backslashes
        .replace(/--/g, '')         // Remove SQL comment
        .replace(/\b(OR|AND|SELECT|INSERT|DELETE|UPDATE|DROP|UNION|WHERE|FROM|INTO|VALUES|TABLE)\b/gi, ''); // Remove SQL keywords
}

function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    }
}

function sanitizeInput(req, res, next) {
    sanitizeObject(req.body);
    sanitizeObject(req.query);
    sanitizeObject(req.params);
    next();
}

module.exports = sanitizeInput;