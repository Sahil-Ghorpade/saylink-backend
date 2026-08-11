const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");

exports.updateSettings = async (req, res) => {
    try {
        const updates = {};
        const userId = req.user._id;
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (req.body.name !== undefined) {
            updates.name = req.body.name.trim();
        }

        if (req.body.bio !== undefined) {
            updates.bio = req.body.bio;
        }

        if (req.body.isPrivate !== undefined) {
            updates.isPrivate = req.body.isPrivate === "true" || req.body.isPrivate === true;
        }

        if (req.body.username !== undefined) {
            const newUsername = req.body.username.trim().toLowerCase();

            if (!newUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Username cannot be empty",
                });
            }

            const usernameRegex = /^[a-zA-Z0-9_.]+$/;
            if (!usernameRegex.test(newUsername)) {
                return res.status(400).json({
                    success: false,
                    message: "Username can only contain letters, numbers, dots, and underscores",
                });
            }

            const existingUser = await User.findOne({
                username: newUsername,
                _id: { $ne: userId },
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Username already taken",
                });
            }

            updates.username = newUsername;
        }

        if (req.file) {
            // Cleanup previous Cloudinary profile image if exists
            if (currentUser.profileImage?.public_id) {
                try {
                    await cloudinary.uploader.destroy(currentUser.profileImage.public_id);
                } catch (cloudinaryErr) {
                    console.warn("Failed to delete old profile image:", cloudinaryErr.message);
                }
            }

            updates.profileImage = {
                url: req.file.path,
                public_id: req.file.filename,
            };
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true }
        ).select("-password");

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update settings",
        });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q;

        if (!query || !query.trim()) {
            return res.json({
                success: true,
                users: [],
            });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query.trim(), $options: "i" } },
                { name: { $regex: query.trim(), $options: "i" } },
            ],
        })
            .select("username name profileImage")
            .limit(15);

        res.json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search users",
        });
    }
};