const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const followController = require("../controllers/follow.controller");

router.post("/:userId", authMiddleware, followController.toggleFollow);

module.exports = router;