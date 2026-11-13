
import api from "./api";

export const getUserProfile = async () => {
    const response = await api.get("/auth/me");
    return response.data.data.user;
};

export const updateUserProfile = async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return response.data.data.user;
};

export const changeUserPassword = async (passwordData) => {
    const response = await api.put(
        "/auth/change-password",
        passwordData
    );

    return response.data;
};

export const updateUserPreferences = async (preferences) => {
    const response = await api.put(
        "/auth/preferences",
        preferences
    );

    return response.data.data.preferences;
};
