const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { getIO } = require("../socket");
const { populate } = require("../models/User");

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        if (!conversation.isAccepted) {
            return res.status(403).json({
                success: false,
                message: "Conversation not accepted yet",
            });
        }

        const messages = await Message.find({
            conversation: conversationId,
        })
            .populate("sender", "username")
            .populate({
                path: "post",
                populate: {
                    path: "author",
                    select: "username profileImage"
                }
            })
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            messages,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
        });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text } = req.body;
        const senderId = req.user._id;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty",
            });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        if (!conversation.participants.includes(senderId)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        if (!conversation.isAccepted) {
            return res.status(403).json({
                success: false,
                message: "Conversation not accepted yet",
            });
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            text,
        });

        conversation.lastMessage = text;
        conversation.updatedAt = new Date();
        await conversation.save();

        const populatedMessage = await message.populate(
            "sender",
            "username"
        );

        const io = getIO();
        io.to(`conversation:${conversationId}`).emit(
            "new_message",
            populatedMessage
        );

        res.status(201).json({
            success: true,
            message: populatedMessage,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
};