const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const controller = require("../controllers/followRequest.controller");

router.get("/", authMiddleware, controller.getFollowRequests);
router.post("/accept/:userId", authMiddleware, controller.acceptFollowRequest);
router.post("/reject/:userId", authMiddleware, controller.rejectFollowRequest);

module.exports = router;