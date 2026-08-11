const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Verify connection on startup ─────────────────────────────────────────────
cloudinary.api.ping()
    .then(() => console.log("✅ Cloudinary connected:", process.env.CLOUDINARY_CLOUD_NAME))
    .catch((err) => console.error("❌ Cloudinary connection failed:", err.message));

// ── Story media storage (image + video) ────────────────────────────────────
const storyStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith("video");
        return {
            folder: "saylink/stories",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: isVideo
                ? ["mp4", "mov", "webm"]
                : ["jpg", "jpeg", "png", "webp"],
        };
    },
});

// ── Post image storage ────────────────────────────────────────────────────
const postStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "saylink/posts",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    },
});

// ── Profile image storage ─────────────────────────────────────────────────
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "saylink/profiles",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    },
});

module.exports = {
    cloudinary,
    storage: storyStorage,    // legacy alias used by story.route.js
    storyStorage,
    postStorage,
    profileStorage,
};