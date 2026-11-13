
const express = require("express");

const {
    registerUser,
    loginUser,
    getCurrentUser,
    updateProfile,
    changePassword,
    updatePreferences
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/preferences", protect, updatePreferences);

module.exports = router;
