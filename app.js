const express = require("express");
const app = express();
const authRoutes = require("./routes/auth.route");
const testRoutes = require("./routes/test.route");
const postRoutes = require("./routes/post.route");
const profileRoutes = require("./routes/profile.route");
const followRoutes = require("./routes/follow.route");
const notificationRoutes = require("./routes/notification.route");
const followRequestRoutes = require("./routes/followRequest.route");
const conversationRoutes = require("./routes/conversation.route");
const messageRoutes = require("./routes/message.route");
const storyRoutes = require("./routes/story.route");
const userRoutes = require("./routes/user.route");
const shareRoutes = require("./routes/share.route");
const mongoose = require("mongoose");
const cors = require("cors");
const { generalLimiter } = require("./middleware/rateLimit.middleware");

const dbUrl = process.env.MONGO_URL;

mongoose
    .connect(dbUrl)
    .then(() => {
        console.log("MongoDB Atlas Cloud connected successfully");
    })
    .catch((err) => {
        console.error("MongoDB Atlas connection error:", err);
    });

const allowedOrigins = process.env.CLIENT_URL.split(",");

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed"));
        }
    },
    credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Saylink backend running");
});

app.use(generalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/follow-requests", followRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/test", testRoutes);

// 404 Fallback Handler for undefined API routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API route '${req.originalUrl}' not found`,
    });
});

// Central Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Backend Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

module.exports = app;