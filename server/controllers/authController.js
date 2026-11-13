const bcrypt = require("bcryptjs");
const User = require("../models/User");

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Never return password
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Current user fetched successfully",
            data: {
                user
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2 || trimmedName.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 50 characters"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: req.user.userId }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                name: trimmedName,
                email: normalizedEmail
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: { user }
        });

    } catch (error) {
        console.error("Update profile error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 6 characters"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const updatePreferences = async (req, res) => {
    try {
        const { theme, emailNotifications, priceAlerts, newsNotifications } = req.body;

        const allowedThemes = ["dark", "light", "system"];

        if (theme !== undefined && !allowedThemes.includes(theme)) {
            return res.status(400).json({
                success: false,
                message: "Invalid theme selected"
            });
        }

        const booleanFields = {
            emailNotifications,
            priceAlerts,
            newsNotifications
        };

        for (const [field, value] of Object.entries(booleanFields)) {
            if (value !== undefined && typeof value !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be true or false`
                });
            }
        }

        const updates = {};

        if (theme !== undefined) updates["preferences.theme"] = theme;
        if (emailNotifications !== undefined) {
            updates["preferences.emailNotifications"] = emailNotifications;
        }
        if (priceAlerts !== undefined) {
            updates["preferences.priceAlerts"] = priceAlerts;
        }
        if (newsNotifications !== undefined) {
            updates["preferences.newsNotifications"] = newsNotifications;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid preferences provided"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Preferences updated successfully",
            data: { preferences: user.preferences }
        });

    } catch (error) {
        console.error("Update preferences error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    updateProfile,
    changePassword,
    updatePreferences
};
