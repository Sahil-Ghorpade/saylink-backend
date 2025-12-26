const User = require("../models/User");
const Notification = require("../models/Notification");
const { emitNotification, emitRemoveNotification } = require("../utils/emitNotificationEvent");

exports.toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user._id;

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself",
            });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isFollowing = currentUser.following.includes(targetUserId);

        // UNFOLLOW
        if (isFollowing) {
            currentUser.following.pull(targetUserId);
            targetUser.followers.pull(currentUserId);

            // Remove FOLLOW notification
            const notification = await Notification.findOneAndDelete({
                type: "follow",
                sender: currentUserId,
                recipient: targetUserId,
            });

            if (notification) {
                emitRemoveNotification(
                    notification.recipient,
                    notification._id
                );
            }

            await currentUser.save();
            await targetUser.save();

            return res.json({
                success: true,
                following: false,
            });
        }

        // PRIVATE ACCOUNT -> FOLLOW REQUEST
        if (targetUser.isPrivate) {
            const alreadyRequested =
                targetUser.followRequests.includes(currentUserId);

            if (!alreadyRequested) {
                targetUser.followRequests.push(currentUserId);
                await targetUser.save();

                // FOLLOW REQUEST NOTIFICATION
                await Notification.create({
                    recipient: targetUserId,
                    sender: currentUserId,
                    type: "follow_request",
                });

                emitNotification(targetUserId, {
                    type: "follow_request",
                    sender: {
                        _id: currentUserId,
                        username: req.user.username,
                        profileImage: currentUser.profileImage,
                    },
                    createdAt: new Date().toISOString(),
                });
            }

            return res.json({
                success: true,
                requested: true,
                message: "Follow request sent",
            });
        }

        // PUBLIC ACCOUNT -> DIRECT FOLLOW
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);

        await currentUser.save();
        await targetUser.save();

        // FOLLOW NOTIFICATION
        await Notification.create({
            recipient: targetUserId,
            sender: currentUserId,
            type: "follow",
        });
        
        emitNotification(targetUserId, {
            type: "follow",
            sender: {
                _id: currentUserId,
                username: currentUser.username,
                profileImage: currentUser.profileImage,
            },
            createdAt: new Date().toISOString(),
        });

        return res.json({
            success: true,
            following: true,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Follow action failed",
        });
    }
};