const { getIO } = require("../socket");

exports.emitStoryViewed = (storyOwnerId, payload) => {
    const io = getIO();
    if (!io) return;

    io.to(`user:${storyOwnerId}`).emit("story_viewed", payload);
};