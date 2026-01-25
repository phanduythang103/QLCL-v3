import React from 'react';
import { X, User, Shield, Building, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserInfoModal: React.FC<UserInfoModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <User className="text-primary-600" size={20} />
                        Thông tin tài khoản
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-0">
                    <div className="bg-gradient-to-br from-primary-500 to-primary-700 h-24 relative">
                        <div className="absolute -bottom-10 left-6">
                            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg">
                                <div className="w-full h-full rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold">
                                    {user.full_name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 pb-8 px-6 space-y-4">
                        <div className="pb-2">
                            <h4 className="text-xl font-bold text-slate-800">{user.full_name}</h4>
                            <p className="text-sm text-slate-500">@{user.username}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                    <Shield size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Vai trò</p>
                                    <p className="text-sm font-semibold text-slate-700">{user.role}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                    <Building size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Khoa / Phòng / Đơn vị</p>
                                    <p className="text-sm font-semibold text-slate-700">{user.department || 'Chưa xác định'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
