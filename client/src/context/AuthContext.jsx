import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getMe()
                .then((data) => setUser(data.user))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const loginUser = (userData, token) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const data = await getMe();
            setUser(data.user);
            return data.user;
        } catch {
            return null;
        }
    };

    // Derived helpers
    const isLearner = user?.isLearner || false;
    const isCoach = user?.isCoach || false;
    const isAdmin = user?.isAdmin || false;
    const coachStatus = user?.coachProfile?.status || null;

    return (
        <AuthContext.Provider value={{
            user, loading, loginUser, logout, setUser, refreshUser,
            isLearner, isCoach, isAdmin, coachStatus,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
