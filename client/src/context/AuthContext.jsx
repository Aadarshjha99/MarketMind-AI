
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore the user's session when the app loads
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("marketmind_token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get("/auth/me");
                setUser(response.data.data.user);
            } catch (error) {
                localStorage.removeItem("marketmind_token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    // Apply the saved theme globally
    useEffect(() => {
        const theme = user?.preferences?.theme || "dark";

        document.documentElement.dataset.theme = theme;
    }, [user?.preferences?.theme]);

    // Login
    const login = async (email, password) => {
        const response = await api.post("/auth/login", {
            email,
            password
        });

        const { token, user: loginUser } = response.data.data;

        localStorage.setItem("marketmind_token", token);
        setUser(loginUser);

        // Fetch full user information, including preferences
        try {
            const profileResponse = await api.get("/auth/me");
            const fullUser = profileResponse.data.data.user;

            setUser(fullUser);
            return fullUser;
        } catch (error) {
            return loginUser;
        }
    };

    // Register
    const register = async (name, email, password) => {
        const response = await api.post("/auth/register", {
            name,
            email,
            password
        });

        return response.data;
    };

    // Update user information throughout the application
    const updateUser = (updatedData) => {
        setUser((previousUser) => ({
            ...previousUser,
            ...updatedData,
            preferences: {
                ...(previousUser?.preferences || {}),
                ...(updatedData?.preferences || {})
            }
        }));
    };

    // Logout
    const logout = () => {
        localStorage.removeItem("marketmind_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
};
