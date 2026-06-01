import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Lock, LogOut, Info, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { UserInfoModal } from './UserInfoModal';

interface HeaderUserMenuProps {
    variant?: 'dark' | 'light';
}

export const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({ variant = 'dark' }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isLight = variant === 'light';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            logout();
            window.location.href = '/login';
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-1.5 transition-colors border md:gap-3 ${isOpen
                    ? (isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/15 border-white/30')
                    : (isLight ? 'hover:bg-slate-100 border-transparent' : 'hover:bg-white/10 border-transparent')
                    }`}
            >
                <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/20 text-white'}`}>
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.full_name?.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="hidden md:block text-left">
                    <p className={`max-w-[150px] truncate text-[12px] font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {user.full_name?.toUpperCase()}
                    </p>
                    <p className={`mt-0.5 text-[12px] uppercase leading-none ${isLight ? 'text-slate-500' : 'text-white/85'}`}>
                        {user.role?.toLowerCase()}
                    </p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isLight ? 'text-slate-500' : 'text-white'} ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Đang đăng nhập với</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.full_name?.toUpperCase()}</p>
                        <p className="text-xs text-slate-500 truncate">{user.department || 'Nhân viên'}</p>
                    </div>

                    <div className="p-1.5">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowInfoModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-colors group"
                        >
                            <div className="p-1.5 bg-slate-50 group-hover:bg-primary-50 rounded-lg text-slate-400 group-hover:text-primary-600 transition-colors">
                                <Info size={16} />
                            </div>
                            <span className="font-medium">Thông tin cá nhân</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowPasswordModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-colors group"
                        >
                            <div className="p-1.5 bg-slate-50 group-hover:bg-primary-50 rounded-lg text-slate-400 group-hover:text-primary-600 transition-colors">
                                <Lock size={16} />
                            </div>
                            <span className="font-medium">Đổi mật khẩu</span>
                        </button>
                    </div>

                    <div className="p-1.5 border-t border-slate-50 mt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                        >
                            <div className="p-1.5 bg-red-50 text-red-500 rounded-lg transition-colors">
                                <LogOut size={16} />
                            </div>
                            <span className="font-bold">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
            <UserInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
            />
        </div>
    );
};
