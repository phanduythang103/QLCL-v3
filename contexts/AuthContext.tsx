import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { storeUser, getStoredUser, clearStoredUser } from '../utils/auth';

interface User {
    id: string;
    username: string;
    full_name: string;
    role: string;
    department?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check stored user on mount
    useEffect(() => {
        const storedUser = getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        try {
            console.log('Login Attempt:', { username, password, status: 'Hoạt động' });

            // Query user from database
            const query = supabase
                .from('users')
                .select('*')
                .ilike('username', username.trim())
                .eq('password', password.trim())
                .eq('status', 'Hoạt động');

            console.log('Executing query...');
            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error('Supabase Login Error:', error);
                return { success: false, error: 'Lỗi kết nối database' };
            }

            if (!data) {
                console.log('Login failed: User not found or incorrect password');
                return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
            }

            const userData: User = {
                id: data.id,
                username: data.username,
                full_name: data.full_name,
                role: data.role,
                department: data.department,
                avatar: data.avatar || null,
            };

            setUser(userData);
            storeUser(userData);

            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Đã xảy ra lỗi khi đăng nhập' };
        }
    };

    const changePassword = async (newPassword: string) => {
        if (!user) return { success: false, error: 'Chưa đăng nhập' };

        try {
            const { error } = await supabase
                .from('users')
                .update({ password: newPassword })
                .eq('id', user.id);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Change password error:', err);
            return { success: false, error: 'Không thể đổi mật khẩu' };
        }
    };

    const logout = () => {
        setUser(null);
        clearStoredUser();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, changePassword, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
