const User = require("../models/User");
const Post = require("../models/Post");
const Story = require("../models/Story");

exports.getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const viewerId = req.user._id.toString();

        const user = await User.findOne({ username })
            .select("-password")
            .populate("followers", "_id");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        const activeStories = await Story.find({
            user: user._id,
            expiresAt: { $gt: new Date() },
        }).select("viewers");

        const hasActiveStory = activeStories.length > 0;

        const hasUnseenStory = activeStories.some(story =>
            !story.viewers.some(
                v => v.toString() === viewerId
            )
        );

        const isOwner = user._id.toString() === viewerId;
        const isFollower = user.followers.some(
            (f) => f._id.toString() === viewerId
        );

        let posts = [];

        if (!user.isPrivate || isOwner || isFollower) {
            posts = await Post.find({ author: user._id })
                .sort({ createdAt: -1 });
        }

        res.json({
            success: true,
            user,
            posts,
            relationship: {
                isOwner,
                isFollower,
                isPrivate: user.isPrivate,
            },
            hasActiveStory,
            hasUnseenStory,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
        });
    }
};
