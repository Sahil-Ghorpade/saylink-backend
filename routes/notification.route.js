const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const notificationController = require("../controllers/notification.controller");

router.get("/", authMiddleware, notificationController.getNotifications);

router.patch(
    "/read",
    authMiddleware,
    notificationController.markAllAsRead
);

module.exports = router;