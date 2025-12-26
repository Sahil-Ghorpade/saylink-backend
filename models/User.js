const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        bio: {
            type: String,
            maxlength: 150,
            default: "",
        },

        profileImage: {
            url: {
                type: String,
                default: "https://static.vecteezy.com/system/resources/thumbnails/002/534/006/small/social-media-chatting-online-blank-profile-picture-head-and-body-icon-people-standing-icon-grey-background-free-vector.jpg",
                set: (v) => v === "" ? undefined : v,
            },
            public_id: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
followers: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
],
following: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
],
isPrivate: {
    type: Boolean,
    default: false,
},

followRequests: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);