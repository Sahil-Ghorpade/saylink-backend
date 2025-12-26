const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });

const userController = require("../controllers/user.controller");

router.patch(
    "/settings",
    authMiddleware,
    upload.single("profileImage"),
    userController.updateSettings
);

router.get("/search", authMiddleware, userController.searchUsers);

module.exports = router;