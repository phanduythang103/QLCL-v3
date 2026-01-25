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
            {/* Left Column - Login Form (1/4) */}
            <div className="w-full lg:w-1/4 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Logo and Title */}
                    <div className="mb-10">
                        <div className="flex flex-col items-center mb-8">
                            <img
                                src="https://i.postimg.cc/YSf7nw74/logo_103_min.png"
                                alt="Logo 103"
                                className="w-24 h-24 object-contain drop-shadow-md mb-4"
                            />
                            <h2 className="text-xl font-bold text-gray-900 text-center uppercase tracking-tight leading-tight">
                                HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG
                            </h2>
                        </div>
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
                    </form>


                </div>
            </div>

            {/* Right Column - Background Image (3/4) */}
            <div className="hidden lg:block lg:w-3/4 relative overflow-hidden bg-gray-950">
                {backgroundUrl ? (
                    <>
                        {/* Blurred background layer to automatically fill colors */}
                        <div
                            className="absolute inset-0 w-full h-full bg-cover bg-center scale-110 blur-3xl opacity-60"
                            style={{ backgroundImage: `url(${backgroundUrl})` }}
                        ></div>

                        {/* Sharp centered image */}
                        <img
                            src={backgroundUrl}
                            alt="Hospital"
                            className="absolute inset-0 w-full h-full object-contain z-0"
                        />
                        {/* Overlay gradient for better text visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>

                        {/* Titles at bottom left */}
                        <div className="absolute bottom-10 left-10 text-white z-10">
                            <h1 className="text-4xl font-bold mb-2 drop-shadow-lg uppercase tracking-wider">
                                {uiSettings?.tieu_de_chinh || 'HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG'}
                            </h1>
                            {uiSettings?.tieu_de_phu && uiSettings?.tieu_de_phu !== 'Test' && (
                                <p className="text-xl drop-shadow-md opacity-90">
                                    {uiSettings.tieu_de_phu}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 flex items-end p-8">
                        <div className="text-white">
                            <h1 className="text-4xl font-bold mb-2">
                                {uiSettings?.tieu_de_chinh || 'Chào mừng đến với'}
                            </h1>
                            <p className="text-xl">
                                {uiSettings?.tieu_de_phu || 'Hệ thống Quản lý Chất lượng'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
