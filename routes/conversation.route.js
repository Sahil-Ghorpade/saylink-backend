const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const controller = require("../controllers/conversation.controller");

router.get("/", authMiddleware, controller.getConversations);

router.get("/requests", authMiddleware, controller.getMessageRequests);

router.post("/:id/accept", authMiddleware, controller.acceptConversationRequest);

router.delete("/:id/reject", authMiddleware, controller.rejectConversationRequest);

router.post("/:userId", authMiddleware, controller.startConversation);

module.exports = router;