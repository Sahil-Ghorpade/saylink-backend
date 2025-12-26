const Story = require("../models/Story");
const User = require("../models/User");
const { emitStoryViewed } = require("../utils/emitStoryEvent");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { cloudinary } = require("../config/cloudinary");

exports.createStory = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Story media is required",
            });
        }

        const mediaType = req.file.mimetype.startsWith("video")
            ? "video"
            : "image";

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const story = await Story.create({
            user: userId,
            media: {
                url: req.file.path,
                type: mediaType,
            },
            expiresAt,
        });

        res.status(201).json({
            success: true,
            story,
        });
    } catch (error) {
        console.error("Create story error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create story",
        });
    }
};

exports.getStoryFeed = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        const user = await User.findById(userId)
            .select("following followers");

        const friends = user.following.filter((id) =>
            user.followers.includes(id)
        );

        // Eligible users:
        // 1. Public accounts user follows
        // 2. Private friends
        const eligibleUserIds = [
            ...user.following,  
            ...friends,         
            userId,           
        ];

        const stories = await Story.find({
            user: { $in: eligibleUserIds },
            expiresAt: { $gt: now },
        })
            .populate("user", "username profileImage isPrivate")
            .populate("viewers", "username profileImage")
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            stories,
        });
    } catch (error) {
        console.error("Story feed error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load stories",
        });
    }
};

exports.viewStory = async (req, res) => {
    try {
        const storyId = req.params.id;
        const viewerId = req.user._id.toString();

        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }

        // Owner viewing their own story (ignore)
        if (story.user.toString() === viewerId) {
            return res.json({
                success: true,
                ignored: true,
                message: "Owner view ignored",
            });
        }

        // CORRECT duplicate-safe check
        const alreadyViewed = story.viewers.some(
            (v) => v.toString() === viewerId
        );

        if (!alreadyViewed) {
            story.viewers.push(viewerId);
            await story.save();
            
            emitStoryViewed(story.user.toString(), {
                storyId: story._id.toString(),
                viewer: {
                    _id: req.user._id,
                    username: req.user.username,
                    profileImage: req.user.profileImage,
                },
            });
        }

        res.json({
            success: true,
            message: "Story marked as viewed",
        });
    } catch (error) {
        console.error("View story error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark story as viewed",
        });
    }
};

exports.replyToStory = async (req, res) => {
    try {
        const storyId = req.params.id;
        const senderId = req.user._id;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Reply cannot be empty",
            });
        }

        const story = await Story.findById(storyId).populate("user");

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }

        const receiverId = story.user._id;

        // Owner replying to own story (not allow)
        if (senderId.toString() === receiverId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Cannot reply to your own story",
            });
        }

        const pairKey = [senderId.toString(), receiverId.toString()]
            .sort()
            .join("_");

        let conversation = await Conversation.findOneAndUpdate(
            { pairKey },
            {
                $setOnInsert: {
                    participants: [senderId, receiverId],
                    pairKey,
                    isAccepted: true,
                },
            },
            {
                new: true,
                upsert: true,
            }
        );

        const message = await Message.create({
            conversation: conversation._id,
            sender: senderId,
            text,
            meta: {
                type: "story_reply",
                storyId: story._id,
            },
        });

        conversation.lastMessage = "Replied to your story";
        await conversation.save();

        if (global.io) {
            global.io
                .to(`user:${receiverId}`)
                .emit("new_message", message);
        }

        res.json({
            success: true,
            message,
        });
    } catch (error) {
        console.error("Story reply error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reply to story",
        });
    }
};  

exports.getUserStories = async (req, res) => {
    try {
        const { userId } = req.params;
        const viewerId = req.user._id;
        const now = new Date();

        const stories = await Story.find({
            user: userId,
            expiresAt: { $gt: now },
        })
            .populate("viewers", "username profileImage")
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            stories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to load user stories",
        });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const storyId = req.params.id;
        const userId = req.user._id.toString();

        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }

        if (story.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        if (story.media?.url) {
            const url = story.media.url;

            const parts = url.split("/");
            const filename = parts[parts.length - 1]; // ojt4gtdsnjv9l7f1h4jz.mp4
            const folder = parts[parts.length - 2];   // saylink_stories

            const publicId = `${folder}/${filename.split(".")[0]}`;

            await cloudinary.uploader.destroy(
                publicId,
                story.media.type === "video"
                    ? { resource_type: "video" }
                    : {}
            );
        }

        await Story.findByIdAndDelete(storyId);

        res.json({
            success: true,
            message: "Story deleted",
        });
    } catch (error) {
        console.error("Delete story error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete story",
        });
    }
};