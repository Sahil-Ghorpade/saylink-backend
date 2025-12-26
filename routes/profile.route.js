const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const profileController = require("../controllers/profile.controller");

router.get("/:username", authMiddleware, profileController.getProfile);

module.exports = router;