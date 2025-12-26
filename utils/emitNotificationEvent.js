const { getIO } = require("../socket");

exports.emitNotification = (userId, payload) => {
    const io = getIO();
    if (!io) return;

    io.to(`user:${userId}`).emit("new_notification", payload);
};

exports.emitRemoveNotification = (recipientId, notificationId) => {
    const io = getIO();
    if (!io) return;
    
    io.to(`user:${recipientId}`).emit(
        "remove_notification",
        { notificationId }
    );
};