import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { validateCredentials } from '../utils/auth';

interface UISettings {
    anh: string;
    tieu_de_chinh: string;
    tieu_de_phu: string;
}

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uiSettings, setUiSettings] = useState<UISettings | null>(null);
    const [backgroundUrl, setBackgroundUrl] = useState('');

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Fetch UI settings
    useEffect(() => {
        async function fetchUISettings() {
            try {
                const { data, error } = await supabase
                    .from('cai_dat_giao_dien')
                    .select('*')
                    .limit(1)
                    .single();

                if (data && !error) {
                    setUiSettings(data);

                    // Get public URL for background image
                    if (data.anh) {
                        const { data: urlData } = supabase.storage
                            .from('avatar')
                            .getPublicUrl(data.anh);

                        if (urlData) {
                            setBackgroundUrl(urlData.publicUrl);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching UI settings:', err);
            }
        }

        fetchUISettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate
        const validation = validateCredentials(username, password);
        if (!validation.valid) {
            setError(validation.error || '');
            return;
        }

        setLoading(true);

        try {
            const result = await login(username, password);

            if (result.success) {
                navigate('/', { replace: true });
            } else {
                setError(result.error || 'Đăng nhập thất bại');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Column - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Logo and Title */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-gray-600">HOSPITAL</h1>
                                <p className="text-xs text-gray-500">Chất Lượng H Care</p>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {uiSettings?.tieu_de_chinh || 'Quản lý Chất lượng Bệnh viện'}
                        </h2>
                        <p className="text-gray-600">
                            {uiSettings?.tieu_de_phu || 'Đăng nhập'}
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Tên đăng nhập
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                placeholder="Nhập tên đăng nhập"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition pr-12"
                                    placeholder="Nhập mật khẩu"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>

                        <div className="text-center">
                            <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                                Quên mật khẩu?
                            </a>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-gray-500">
                        <p>1/4</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Background Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                {backgroundUrl ? (
                    <img
                        src={backgroundUrl}
                        alt="Hospital"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <div className="text-white text-center p-8">
                            <h3 className="text-3xl font-bold mb-4">Chào mừng đến với</h3>
                            <p className="text-xl">Hệ thống Quản lý Chất lượng</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
