const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { cloudinary } = require("../config/cloudinary");
const { emitNotification, emitRemoveNotification } = require("../utils/emitNotificationEvent");

exports.createPost = async (req, res) => {
    try {
        const { caption } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Post must contain an image",
            });
        }

        const postData = {
            caption: caption || "", // caption optional
            author: req.user._id,
            image: {
                url: req.file.path,
                public_id: req.file.filename,
            },
        };

        const post = new Post(postData);
        await post.save();

        res.status(201).json({
            success: true,
            message: "Post created",
            post,
        });
    } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create post",
        });
    }
};

exports.getFeed = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const currentUser = await User.findById(currentUserId)
            .select("following");

        const followingIds = currentUser.following;

        const publicUsers = await User.find({ isPrivate: false })
            .select("_id");

        const publicUserIds = publicUsers.map((u) => u._id);

        const posts = await Post.find({
            $or: [
                { author: currentUserId },
                { author: { $in: followingIds } },
                {
                    author: {
                        $in: publicUserIds,
                        $nin: [...followingIds, currentUserId],
                    },
                },
            ],
        })
            .populate("author", "username isPrivate profileImage")
            .populate({
                path: "comments",
                populate: {
                    path: "author",
                    select: "username profileImage",
                },
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            posts,
            hasMore: posts.length === limit,
        });
    } catch (error) {
        console.error("Feed error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load feed",
        });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        if (isLiked && post.author.toString() !== userId.toString()) {
            const notification = await Notification.findOneAndDelete({
                type: "like",
                sender: userId,
                recipient: post.author,
                post: post._id,
            });

            if (notification) {
                emitRemoveNotification(
                    notification.recipient,
                    notification._id
                );
            }
        }

        await post.save();

        if (!isLiked && post.author.toString() !== userId.toString()) {
            const notification = await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: "like",
                post: post._id,
            });

            emitNotification(post.author.toString(), {
                _id: notification._id,
                type: "like",
                sender: {
                    _id: req.user._id,
                    username: req.user.username,
                },
                post: {
                    _id: post._id,
                    caption: post.caption,
                },
                createdAt: notification.createdAt,
                isRead: false,
            });
        }

        res.json({
            success: true,
            likesCount: post.likes.length,
            liked: !isLiked,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to toggle like",
        });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;

        if (!text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty",
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // CREATE COMMENT
        const comment = await Comment.create({
            text,
            author: req.user._id,
            post: postId,
        });

        const populatedComment = await comment.populate(
            "author",
            "username profileImage"
        );

        post.comments.push(comment._id);
        await post.save();

        // NOTIFY POST OWNER (NOT SELF)
        if (post.author.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: "comment",
                post: post._id,
                comment: comment._id,
            });

            emitNotification(post.author.toString(), {
                _id: notification._id,
                type: "comment",
                sender: {
                    _id: req.user._id,
                    username: req.user.username,
                },
                post: {
                    _id: post._id,
                    caption: post.caption,
                },
                createdAt: notification.createdAt,
                isRead: false,
            });
        }

        res.status(201).json({
            success: true,
            comment: populatedComment,
        });
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add comment",
        });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id.toString();

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Owner check
        if (post.author.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this post",
            });
        }

        // Delete media from Cloudinary
        if (post.image?.public_id) {
            await cloudinary.uploader.destroy(post.image.public_id);
        }

        // Cleanup related data
        await Comment.deleteMany({ post: postId });
        await Notification.deleteMany({ post: postId });

        // Delete post
        await Post.findByIdAndDelete(postId);

        res.json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete post",
        });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const userId = req.user._id.toString();

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        // Authorization
        const isCommentOwner =
            comment.author.toString() === userId;

        const isPostOwner =
            post.author.toString() === userId;

        if (!isCommentOwner && !isPostOwner) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this comment",
            });
        }

        // Remove comment reference from post
        post.comments.pull(commentId);
        await post.save();

        // Delete comment
        await Comment.findByIdAndDelete(commentId);

        const notification = await Notification.findOneAndDelete({
            type: "comment",
            comment: commentId,
        });

        if (notification) {
            emitRemoveNotification(notification.recipient, notification._id);
        }

        res.json({
            success: true,
            message: "Comment deleted",
        });
    } catch (error) {
        console.error("Delete comment error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete comment",
        });
    }
};

exports.getSinglePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate("author", "username profileImage")
            .populate({
                path: "comments",
                populate: {
                    path: "author",
                    select: "username profileImage",
                },
            });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        res.json({
            success: true,
            post,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to load post",
        });
    }
};