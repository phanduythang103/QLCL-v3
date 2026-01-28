import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Lock, LogOut, Info, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { UserInfoModal } from './UserInfoModal';

export const HeaderUserMenu: React.FC = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                className={`flex items-center gap-2 md:gap-3 p-1.5 pr-2.5 rounded-xl transition-all duration-200 border ${isOpen ? 'bg-primary-50 border-primary-200' : 'hover:bg-slate-50 border-transparent'
                    }`}
            >
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-primary-900/10 overflow-hidden">
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.full_name?.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-slate-700 leading-tight truncate max-w-[150px]">
                        {user.full_name?.toUpperCase()}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none mt-0.5">
                        {user.role?.toLowerCase()}
                    </p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
