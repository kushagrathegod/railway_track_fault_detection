import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = "http://localhost:8000";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Fetch user data on mount if token exists
    useEffect(() => {
        if (token) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUserData = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch user data:', err);
            logout(); // Token invalid, logout
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await axios.post(`${API_URL}/auth/login`, formData);
        const newToken = res.data.access_token;

        localStorage.setItem('token', newToken);
        setToken(newToken);

        // Fetch user data after login
        const userRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` }
        });
        setUser(userRes.data);

        return userRes.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        token
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
