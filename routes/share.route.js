const router = require("express").Router();
const { getShareUsers, sharePost } = require("../controllers/share.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/users", authMiddleware, getShareUsers);

router.post("/share", authMiddleware, sharePost);

module.exports = router;