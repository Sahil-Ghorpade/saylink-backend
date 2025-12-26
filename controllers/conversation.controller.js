const Conversation = require("../models/Conversation");
const User = require("../models/User");

exports.startConversation = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.userId;

        const ids = [senderId.toString(), receiverId.toString()].sort();
        const pairKey = ids.join("_");

        if (senderId.toString() === receiverId) {
            return res.status(400).json({
                success: false,
                message: "You cannot message yourself",
            });
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const senderFollowsReceiver =
            sender.following.includes(receiverId);

        const receiverFollowsSender =
            receiver.following.includes(senderId);

        //  Private account (not approved follower)
        if (receiver.isPrivate && !receiverFollowsSender) {
            return res.status(403).json({
                success: false,
                message: "This account is private",
            });
        }

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({ pairKey });

        if (existingConversation) {
            return res.json({
                success: true,
                conversation: existingConversation,
                isRequest: !existingConversation.isAccepted,
            });
        }

        // Friends -> auto accept
        const isFriend = senderFollowsReceiver && receiverFollowsSender;

        const conversation = await Conversation.create({
            participants: [senderId, receiverId],
            pairKey,
            isAccepted: isFriend,
            requestedBy: isFriend ? null : senderId,
        });

        res.status(201).json({
            success: true,
            conversation,
            isRequest: !isFriend,
        });
    } catch (error) {
        console.error("START CONVERSATION ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Conversation already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to start conversation",
        });
    }
};

exports.getMessageRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const requests = await Conversation.find({
            participants: userId,
            isAccepted: false,
            requestedBy: { $ne: userId },
        })
            .populate("participants", "username profileImage")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            requests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch message requests",
        });
    }
};

exports.acceptConversationRequest = async (req, res) => {
    try {
        const conversationId = req.params.id;
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

        conversation.isAccepted = true;
        conversation.requestedBy = null;
        await conversation.save();

        res.json({
            success: true,
            conversation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to accept request",
        });
    }
};

exports.rejectConversationRequest = async (req, res) => {
    try {
        const conversationId = req.params.id;
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

        await conversation.deleteOne();

        res.json({
            success: true,
            message: "Message request rejected",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to reject request",
        });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
            isAccepted: true,
        })
            .populate("participants", "username profileImage")
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            conversations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
        });
    }
};