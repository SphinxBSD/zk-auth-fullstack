'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { User, PublicData } from '@/types/auth';

interface AuthContextType {
    user: User | null;
    message: string;
    loading: boolean;
    register: (username: string, commitment: string, salt: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: {children: ReactNode}) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [message, setMessage] = useState("");

    const checkAuth = async () => {
        try {
            if (apiClient.isAuthenticated()) {
                const userData = await apiClient.getProfile();
                setUser(userData);
            }
        } catch (error) {
            console.error('Error verificando autenticacion:', error);
            apiClient.logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        checkAuth();
    }, []);

    const register = async (username: string, commitment: string, salt: string) => {
        try {
            const response = await apiClient.register({username, commitment, salt});
            setMessage(response.message);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Error al registrarse');
        }
    }

    const logout = () => {
        apiClient.logout();
        setUser(null);
    }

    const value: AuthContextType = {
        user,
        loading,
        register,
        logout,
        isAuthenticated: !!user,
        message,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
}