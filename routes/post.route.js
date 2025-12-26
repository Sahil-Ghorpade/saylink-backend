const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const postController = require("../controllers/post.controller");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
const { actionLimiter } = require("../middleware/rateLimit.middleware");

router.post(
    "/",
    authMiddleware,
    upload.single("image"),
    postController.createPost
);

router.get("/feed", authMiddleware, postController.getFeed);

router.post("/:postId/like", authMiddleware, actionLimiter, postController.toggleLike);

router.post("/:postId/comment", authMiddleware, actionLimiter, postController.addComment);

router.delete("/:postId", authMiddleware, postController.deletePost);

router.delete(
    "/:postId/comments/:commentId",
    authMiddleware,
    postController.deleteComment
);

router.get("/:id", authMiddleware, postController.getSinglePost);

module.exports = router;