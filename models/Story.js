const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        media: {
            url: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                enum: ["image", "video"],
                required: true,
            },
        },

        viewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

storySchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("Story", storySchema);
