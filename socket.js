const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

let io;

const initSocket = (server) => {
    const allowedOrigins = process.env.CLIENT_URL.split(",");

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication error"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.userId = user._id.toString();
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.userId);

        socket.join(`user:${socket.userId}`);

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.userId);
        });

        socket.on("join_conversations", (conversationIds) => {
            if (!Array.isArray(conversationIds)) return;

            conversationIds.forEach((id) => {
                socket.join(`conversation:${id}`);
            });
        });

        socket.on("typing", ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit(
                "user_typing",
                {
                    userId: socket.userId,
                    conversationId,
                }
            );
        });

        socket.on("stop_typing", ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit(
                "user_stop_typing",
                {
                    userId: socket.userId,
                    conversationId,
                }
            );
        });

        socket.on("message_delivered", ({ conversationId, messageId }) => {
            socket.to(`conversation:${conversationId}`).emit(
                "message_delivered_ack",
                {
                    messageId,
                }
            );
        });

        socket.on("messages_seen", ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit(
                "messages_seen_ack",
                { conversationId }
            );
        });

    });
};

const getIO = () => io;

module.exports = { initSocket, getIO };