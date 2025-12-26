const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimit.middleware");

router.post("/signup",authLimiter, authController.signup);
router.post("/login",authLimiter, authController.login);

module.exports = router;