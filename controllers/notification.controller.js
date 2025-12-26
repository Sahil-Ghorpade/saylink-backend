const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({
            recipient: userId,
        })
            .populate("sender", "username profileImage")
            .populate("post", "caption")
            .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });

        res.json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read",
        });
    }
};