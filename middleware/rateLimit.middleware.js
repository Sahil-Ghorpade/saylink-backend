const rateLimit = require("express-rate-limit");

exports.generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, 
    standardHeaders: true,
    legacyHeaders: false,
});

exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: "Too many attempts. Try again later.",
    },
});

exports.actionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30, 
    message: {
        success: false,
        message: "Too many actions. Slow down.",
    },
});