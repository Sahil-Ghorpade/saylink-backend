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
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
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

module.exports = app;