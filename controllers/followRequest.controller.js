const User = require("../models/User");

exports.getFollowRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("followRequests", "username email profileImage");

        res.json({
            success: true,
            requests: user.followRequests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch follow requests",
        });
    }
};

exports.acceptFollowRequest = async (req, res) => {
    try {
        const requesterId = req.params.userId;
        const currentUser = await User.findById(req.user._id);
        const requester = await User.findById(requesterId);

        if (!currentUser || !requester) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Remove request
        currentUser.followRequests.pull(requesterId);

        // Add follower/following
        currentUser.followers.push(requesterId);
        requester.following.push(req.user._id);

        await currentUser.save();
        await requester.save();

        res.json({
            success: true,
            message: "Follow request accepted",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to accept request",
        });
    }
};

exports.rejectFollowRequest = async (req, res) => {
    try {
        const requesterId = req.params.userId;
        const currentUser = await User.findById(req.user._id);

        currentUser.followRequests.pull(requesterId);
        await currentUser.save();

        res.json({
            success: true,
            message: "Follow request rejected",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to reject request",
        });
    }
};