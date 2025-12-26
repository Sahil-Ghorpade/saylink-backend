const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
const { createStory, getStoryFeed, viewStory, getUserStories, replyToStory, deleteStory } = require("../controllers/story.controller");
const { actionLimiter } = require("../middleware/rateLimit.middleware");

// Create a story
router.post(
    "/",
    actionLimiter,
    authMiddleware,
    upload.single("media"),
    createStory
);

router.get("/feed", authMiddleware, getStoryFeed);

router.get("/user/:userId", authMiddleware, getUserStories);

router.post("/:id/view", authMiddleware, actionLimiter, viewStory);

router.post("/:id/reply", authMiddleware, actionLimiter, replyToStory);

router.delete("/:id", authMiddleware, deleteStory);

module.exports = router;