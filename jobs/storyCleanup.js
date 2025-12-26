const cron = require("node-cron");
const Story = require("../models/Story");
const { cloudinary } = require("../config/cloudinary");

cron.schedule("*/5 * * * *", async () => {
    try {
        const now = new Date();

        const expiredStories = await Story.find({
            expiresAt: { $lt: now },
        });

        if (expiredStories.length === 0) return;

        for (const story of expiredStories) {
            if (story.media?.public_id) {
                await cloudinary.uploader.destroy(
                    story.media.public_id,
                    {
                        resource_type:
                            story.media.type === "video"
                                ? "video"
                                : "image",
                    }
                );
            }

            await Story.findByIdAndDelete(story._id);
        }

    } catch (error) {
        console.error("Story cleanup error:", error);
    }
});