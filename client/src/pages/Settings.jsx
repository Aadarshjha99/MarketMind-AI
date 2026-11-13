
import { useEffect, useState } from "react";
import {
    UserRound,
    ShieldCheck,
    SlidersHorizontal,
    Save,
    LockKeyhole,
    Mail,
    Bell,
    TrendingUp,
    Newspaper,
    Sun,
    Moon,
    Monitor,
    CheckCircle2,
    AlertCircle,
    LoaderCircle
} from "lucide-react";

import {
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    updateUserPreferences
} from "../services/settingsApi";

import "./Settings.css";

import { useAuth } from "../context/AuthContext";

const defaultPreferences = {
    theme: "dark",
    emailNotifications: true,
    priceAlerts: true,
    newsNotifications: true
};

function Settings() {
    const [activeTab, setActiveTab] = useState("profile");

    const [loading, setLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [preferencesSaving, setPreferencesSaving] = useState(false);
    const { updateUser } = useAuth();

    const [profile, setProfile] = useState({
        name: "",
        email: ""
    });

    const [preferences, setPreferences] = useState(defaultPreferences);

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [notice, setNotice] = useState({
        type: "",
        message: ""
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);

                const user = await getUserProfile();

                setProfile({
                    name: user.name || "",
                    email: user.email || ""
                });

                setPreferences({
                    ...defaultPreferences,
                    ...(user.preferences || {})
                });
            } catch (error) {
                setNotice({
                    type: "error",
                    message:
                        error.response?.data?.message ||
                        "Unable to load account settings."
                });
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const showNotice = (type, message) => {
        setNotice({ type, message });
    };

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        try {
            setProfileSaving(true);
            setNotice({ type: "", message: "" });
            const updatedUser = await updateUserProfile(profile);
            updateUser(updatedUser);
            setProfile({name: updatedUser.name,
                email: updatedUser.email
            });

            showNotice("success", "Profile updated successfully.");
        } catch (error) {
            showNotice(
                "error",
                error.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;

        setPasswords((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            showNotice("error", "New passwords do not match.");
            return;
        }

        if (passwords.newPassword.length < 6) {
            showNotice(
                "error",
                "New password must contain at least 6 characters."
            );
            return;
        }

        try {
            setPasswordSaving(true);
            setNotice({ type: "", message: "" });

            await changeUserPassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });

            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            showNotice("success", "Password changed successfully.");
        } catch (error) {
            showNotice(
                "error",
                error.response?.data?.message ||
                "Unable to change password."
            );
        } finally {
            setPasswordSaving(false);
        }
    };

    const handlePreferenceChange = (name, value) => {
        setPreferences((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handlePreferencesSubmit = async () => {
        try {
            setPreferencesSaving(true);
            setNotice({ type: "", message: "" });

            const savedPreferences =
                await updateUserPreferences(preferences);

            updateUser({
                preferences: savedPreferences
            });

            setPreferences({
                ...defaultPreferences,
                ...savedPreferences
            });

            showNotice("success", "Preferences saved successfully.");
        } catch (error) {
            showNotice(
                "error",
                error.response?.data?.message ||
                "Unable to save preferences."
            );
        } finally {
            setPreferencesSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-loading">
                <LoaderCircle className="settings-spinner" size={28} />
                <p>Loading your settings...</p>
            </div>
        );
    }

    return (
        <div className="settings-page">

            <div className="settings-header">
                <div>
                    <span className="settings-eyebrow">
                        ACCOUNT MANAGEMENT
                    </span>

                    <h1>Settings</h1>

                    <p>
                        Manage your profile, security and preferences.
                    </p>
                </div>

                <div className="settings-header-icon">
                    <SlidersHorizontal size={25} />
                </div>
            </div>

            {notice.message && (
                <div className={`settings-notice ${notice.type}`}>
                    {notice.type === "success" ? (
                        <CheckCircle2 size={18} />
                    ) : (
                        <AlertCircle size={18} />
                    )}

                    <span>{notice.message}</span>

                    <button
                        type="button"
                        onClick={() => setNotice({
                            type: "",
                            message: ""
                        })}
                        aria-label="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="settings-container">

                <aside className="settings-sidebar">

                    <div className="settings-user-card">
                        <div className="settings-avatar">
                            {profile.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div className="settings-user-info">
                            <strong>{profile.name}</strong>
                            <span>{profile.email}</span>
                        </div>
                    </div>

                    <div className="settings-menu">
                        <p>ACCOUNT SETTINGS</p>

                        <button
                            className={activeTab === "profile" ? "active" : ""}
                            onClick={() => setActiveTab("profile")}
                        >
                            <UserRound size={18} />
                            <span>Profile</span>
                        </button>

                        <button
                            className={activeTab === "security" ? "active" : ""}
                            onClick={() => setActiveTab("security")}
                        >
                            <ShieldCheck size={18} />
                            <span>Security</span>
                        </button>

                        <button
                            className={
                                activeTab === "preferences" ? "active" : ""
                            }
                            onClick={() => setActiveTab("preferences")}
                        >
                            <SlidersHorizontal size={18} />
                            <span>Preferences</span>
                        </button>
                    </div>

                    <div className="settings-sidebar-footer">
                        <LockKeyhole size={16} />
                        <span>Your account is protected</span>
                    </div>

                </aside>

                <section className="settings-content">

                    {activeTab === "profile" && (
                        <div className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <UserRound size={20} />
                                </div>

                                <div>
                                    <h2>Profile Information</h2>
                                    <p>
                                        Update your personal account details.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit}>
                                <div className="settings-form-grid">

                                    <div className="settings-field">
                                        <label htmlFor="settings-name">
                                            Full Name
                                        </label>

                                        <div className="settings-input-wrapper">
                                            <UserRound size={17} />

                                            <input
                                                id="settings-name"
                                                type="text"
                                                name="name"
                                                value={profile.name}
                                                onChange={handleProfileChange}
                                                minLength={2}
                                                maxLength={50}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="settings-field">
                                        <label htmlFor="settings-email">
                                            Email Address
                                        </label>

                                        <div className="settings-input-wrapper">
                                            <Mail size={17} />

                                            <input
                                                id="settings-email"
                                                type="email"
                                                name="email"
                                                value={profile.email}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                </div>

                                <div className="settings-form-footer">
                                    <button
                                        type="submit"
                                        className="settings-primary-btn"
                                        disabled={profileSaving}
                                    >
                                        {profileSaving ? (
                                            <LoaderCircle
                                                size={17}
                                                className="settings-spinner"
                                            />
                                        ) : (
                                            <Save size={17} />
                                        )}

                                        {profileSaving
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>
                                </div>
                            </form>

                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <ShieldCheck size={20} />
                                </div>

                                <div>
                                    <h2>Account Security</h2>
                                    <p>
                                        Keep your account secure with a strong
                                        password.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordSubmit}>

                                <div className="settings-password-info">
                                    <LockKeyhole size={20} />

                                    <div>
                                        <strong>Change your password</strong>
                                        <p>
                                            Your current password is required
                                            to make this change.
                                        </p>
                                    </div>
                                </div>

                                <div className="settings-field">
                                    <label htmlFor="current-password">
                                        Current Password
                                    </label>

                                    <input
                                        id="current-password"
                                        className="settings-plain-input"
                                        type="password"
                                        name="currentPassword"
                                        value={passwords.currentPassword}
                                        onChange={handlePasswordChange}
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>

                                <div className="settings-field">
                                    <label htmlFor="new-password">
                                        New Password
                                    </label>

                                    <input
                                        id="new-password"
                                        className="settings-plain-input"
                                        type="password"
                                        name="newPassword"
                                        value={passwords.newPassword}
                                        onChange={handlePasswordChange}
                                        minLength={6}
                                        autoComplete="new-password"
                                        required
                                    />

                                    <small>
                                        Minimum 6 characters.
                                    </small>
                                </div>

                                <div className="settings-field">
                                    <label htmlFor="confirm-password">
                                        Confirm New Password
                                    </label>

                                    <input
                                        id="confirm-password"
                                        className="settings-plain-input"
                                        type="password"
                                        name="confirmPassword"
                                        value={passwords.confirmPassword}
                                        onChange={handlePasswordChange}
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>

                                <div className="settings-form-footer">
                                    <button
                                        type="submit"
                                        className="settings-primary-btn"
                                        disabled={passwordSaving}
                                    >
                                        {passwordSaving ? (
                                            <LoaderCircle
                                                size={17}
                                                className="settings-spinner"
                                            />
                                        ) : (
                                            <LockKeyhole size={17} />
                                        )}

                                        {passwordSaving
                                            ? "Updating..."
                                            : "Update Password"}
                                    </button>
                                </div>

                            </form>
                        </div>
                    )}

                    {activeTab === "preferences" && (
                        <div className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <SlidersHorizontal size={20} />
                                </div>

                                <div>
                                    <h2>Preferences</h2>
                                    <p>
                                        Customize your MarketMind experience.
                                    </p>
                                </div>
                            </div>

                            <div className="settings-preference-group">
                                <h3>Appearance</h3>

                                <p>
                                    Choose your preferred interface theme.
                                </p>

                                <div className="settings-theme-options">

                                    {[
                                        {
                                            value: "dark",
                                            label: "Dark",
                                            icon: Moon
                                        },
                                        {
                                            value: "light",
                                            label: "Light",
                                            icon: Sun
                                        },
                                        {
                                            value: "system",
                                            label: "System",
                                            icon: Monitor
                                        }
                                    ].map((theme) => {
                                        const Icon = theme.icon;

                                        return (
                                            <button
                                                key={theme.value}
                                                type="button"
                                                className={`settings-theme-option ${
                                                    preferences.theme === theme.value
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handlePreferenceChange(
                                                        "theme",
                                                        theme.value
                                                    )
                                                }
                                            >
                                                <Icon size={20} />
                                                <span>{theme.label}</span>

                                                {preferences.theme === theme.value && (
                                                    <CheckCircle2 size={16} />
                                                )}
                                            </button>
                                        );
                                    })}

                                </div>
                            </div>

                            <div className="settings-preference-group">
                                <h3>Notifications</h3>

                                <p>
                                    Choose which notifications you want to
                                    receive.
                                </p>

                                <div className="settings-toggle-list">

                                    <div className="settings-toggle-item">
                                        <div className="settings-toggle-icon">
                                            <Mail size={19} />
                                        </div>

                                        <div className="settings-toggle-info">
                                            <strong>Email Notifications</strong>
                                            <span>
                                                Receive account updates through
                                                email.
                                            </span>
                                        </div>

                                        <label className="settings-switch">
                                            <input
                                                type="checkbox"
                                                checked={preferences.emailNotifications}
                                                onChange={(event) =>
                                                    handlePreferenceChange(
                                                        "emailNotifications",
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            <span></span>
                                        </label>
                                    </div>

                                    <div className="settings-toggle-item">
                                        <div className="settings-toggle-icon">
                                            <TrendingUp size={19} />
                                        </div>

                                        <div className="settings-toggle-info">
                                            <strong>Price Alerts</strong>
                                            <span>
                                                Receive alerts about your tracked
                                                stocks.
                                            </span>
                                        </div>

                                        <label className="settings-switch">
                                            <input
                                                type="checkbox"
                                                checked={preferences.priceAlerts}
                                                onChange={(event) =>
                                                    handlePreferenceChange(
                                                        "priceAlerts",
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            <span></span>
                                        </label>
                                    </div>

                                    <div className="settings-toggle-item">
                                        <div className="settings-toggle-icon">
                                            <Newspaper size={19} />
                                        </div>

                                        <div className="settings-toggle-info">
                                            <strong>News Notifications</strong>
                                            <span>
                                                Receive updates about stock-related
                                                news.
                                            </span>
                                        </div>

                                        <label className="settings-switch">
                                            <input
                                                type="checkbox"
                                                checked={preferences.newsNotifications}
                                                onChange={(event) =>
                                                    handlePreferenceChange(
                                                        "newsNotifications",
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            <span></span>
                                        </label>
                                    </div>

                                </div>
                            </div>

                            <div className="settings-form-footer">
                                <button
                                    type="button"
                                    className="settings-primary-btn"
                                    onClick={handlePreferencesSubmit}
                                    disabled={preferencesSaving}
                                >
                                    {preferencesSaving ? (
                                        <LoaderCircle
                                            size={17}
                                            className="settings-spinner"
                                        />
                                    ) : (
                                        <Save size={17} />
                                    )}

                                    {preferencesSaving
                                        ? "Saving..."
                                        : "Save Preferences"}
                                </button>
                            </div>

                        </div>
                    )}

                </section>
            </div>
        </div>
    );
}

export default Settings;
