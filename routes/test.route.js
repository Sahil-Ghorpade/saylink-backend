const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

router.get("/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Protected route accessed",
        user: req.user,
    });
});

module.exports = router;