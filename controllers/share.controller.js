const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Message = require("../models/Message");
const Post = require("../models/Post");

exports.getShareUsers = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
            isGroup: false,
        })
            .populate("participants", "username profileImage")
            .sort({ updatedAt: -1 })
            .limit(10);

        const recentUsers = conversations
            .map(c =>
                c.participants.find(p => p._id.toString() !== userId.toString())
            )
            .filter(Boolean);

        const user = await User.findById(userId).select("following");
        const followingUsers = await User.find({
            _id: { $in: user.following },
        }).select("username profileImage");

        const map = new Map();
        [...recentUsers, ...followingUsers].forEach(u => {
            map.set(u._id.toString(), u);
        });

        res.json({
            success: true,
            users: Array.from(map.values()),
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to load share users",
        });
    }
};

exports.sharePost = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { receiverId, postId } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        const pairKey = [senderId.toString(), receiverId.toString()]
            .sort()
            .join("_");

        let conversation = await Conversation.findOne({ pairKey });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                pairKey,
                isAccepted: true,
            });
        }

        const message = await Message.create({
            conversation: conversation._id,
            sender: senderId,
            type: "post",
            post: postId,
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        res.status(201).json({
            success: true,
            message,
        });

    } catch (error) {
        console.error("Share post error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to share post",
        });
    }
};