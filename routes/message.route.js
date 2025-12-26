const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const controller = require("../controllers/message.controller");

router.get("/:conversationId", authMiddleware, controller.getMessages);

router.post("/:conversationId", authMiddleware, controller.sendMessage);

module.exports = router;