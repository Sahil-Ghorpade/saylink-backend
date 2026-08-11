const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name || "",
                username: user.username,
                email: user.email,
                bio: user.bio || "",
                isPrivate: user.isPrivate || false,
                profileImage: user.profileImage,
                followers: user.followers || [],
                following: user.following || [],
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

exports.signup = async (req, res) => {
    try {
        let { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim().toLowerCase();

        // Username validation
        if (normalizedUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Username must be at least 3 characters long",
            });
        }

        const usernameRegex = /^[a-zA-Z0-9_.]+$/;
        if (!usernameRegex.test(normalizedUsername)) {
            return res.status(400).json({
                success: false,
                message: "Username can only contain letters, numbers, dots, and underscores",
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        const existingUsername = await User.findOne({ username: normalizedUsername });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "This username is already taken",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "Account created successfully",
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};