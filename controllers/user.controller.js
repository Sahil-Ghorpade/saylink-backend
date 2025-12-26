const User = require("../models/User");

exports.updateSettings = async (req, res) => {
    try {
        const updates = {};
        const userId = req.user._id;

        if (req.body.name !== undefined) {
            updates.name = req.body.name.trim();
        }

        if (req.body.bio !== undefined) {
            updates.bio = req.body.bio;
        }

        if (req.body.isPrivate !== undefined) {
            updates.isPrivate = req.body.isPrivate;
        }

        if (req.body.username !== undefined) {
            const newUsername = req.body.username.trim().toLowerCase();

            if (!newUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Username cannot be empty",
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
            username: { $regex: query, $options: "i" },
        })
            .select("username profileImage")
            .limit(10);

        res.json({
            success: true,
            users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to search users",
        });
    }
};