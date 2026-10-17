import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user on refresh if token exists
    useEffect(() => {
        const fetchMe = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await apiClient.get("/auth/me");
                if (res.data?.success) {
                    setUser(res.data.data);
                }
            } catch (err) {
                console.error("Failed to restore session", err);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, []);

    const login = async (email, password) => {
        const res = await apiClient.post("/auth/login", { email, password });
        if (res.data?.success) {
            const { user, accessToken, refreshToken } = res.data.data;
            localStorage.setItem("accessToken", accessToken);
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
            setUser(user);
            return user;
        }
    };

    const register = async (name, email, password, role) => {
        const res = await apiClient.post("/auth/register", { name, email, password, role });
        return res.data;
    };

    const logout = async () => {
        try {
            await apiClient.post("/auth/logout");
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
    };

    // Quick helper for easy testing of any role
    const demoLogin = async (roleEmail) => {
        return await login(roleEmail, "Password@123");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                demoLogin,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
