
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 2,
            maxlength: 50
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        preferences: {
            theme: {
                type: String,
                enum: ["dark", "light", "system"],
                default: "dark"
            },
            emailNotifications: {
                type: Boolean,
                default: true
            },
            priceAlerts: {
                type: Boolean,
                default: true
            },
            newsNotifications: {
                type: Boolean,
                default: true
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
