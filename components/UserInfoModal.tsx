import React, { useEffect, useState } from 'react';
import { X, User, Shield, Building, Tag, Phone, Mail, Award, Briefcase, Activity, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchNhanSuQlcl, NhanSuQlcl } from '../readNhanSuQlcl';

interface UserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserInfoModal: React.FC<UserInfoModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [staffInfo, setStaffInfo] = useState<NhanSuQlcl | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadStaffInfo = async () => {
            if (isOpen && user) {
                setLoading(true);
                try {
                    const allStaff = await fetchNhanSuQlcl();
                    // Match by name and department (if department exists)
                    // Note: This is a simple match. ideally we link by user_id if available, but currently by name/dept
                    const matched = allStaff.find(s =>
                        s.ho_ten.toLowerCase() === user.full_name.toLowerCase() &&
                        (!user.department || s.don_vi === user.department)
                    );
                    setStaffInfo(matched || null);
                } catch (error) {
                    console.error("Error loading staff info:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setStaffInfo(null);
            }
        };

        loadStaffInfo();
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <User className="text-primary-600" size={24} />
                        Hồ sơ cá nhân
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-0 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Cover & Avatar */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 h-32 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 rounded-[24px] bg-white p-1.5 shadow-xl">
                                <div className="w-full h-full rounded-[20px] bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-black overflow-hidden border border-primary-200">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        user.full_name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-8 space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-slate-800">{user.full_name.toUpperCase()}</h4>
                            <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                <Tag size={14} />
                                @{user.username}
                            </p>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="py-4 text-center text-slate-400 text-sm font-bold italic animate-pulse">
                                Đang tải thông tin chi tiết...
                            </div>
                        )}

                        {/* Detailed Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Vai trò (User Role) */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-primary-500 group-hover:scale-110 transition-transform">
                                        <Shield size={18} />
                                    </div>
                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Quyền hạn</span>
                                </div>
                                <p className="text-sm font-bold text-slate-700 pl-11 capitalize">{user.role}</p>
                            </div>

                            {/* Đơn vị (Department) */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                                        <Building size={18} />
                                    </div>
                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Đơn vị</span>
                                </div>
                                <p className="text-sm font-bold text-slate-700 pl-11">{user.department || staffInfo?.don_vi || '---'}</p>
                            </div>

                            {/* Cấp bậc (Rank) - From Staff Info */}
                            {staffInfo?.cap_bac && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-yellow-500 group-hover:scale-110 transition-transform">
                                            <Award size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Cấp bậc</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 pl-11">{staffInfo.cap_bac}</p>
                                </div>
                            )}

                            {/* Chức vụ (Position) - From Staff Info */}
                            {staffInfo?.chuc_vu && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-purple-500 group-hover:scale-110 transition-transform">
                                            <Briefcase size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Chức vụ</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 pl-11">{staffInfo.chuc_vu}</p>
                                </div>
                            )}

                            {/* SĐT - From Staff Info */}
                            {staffInfo?.so_dien_thoai && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-green-500 group-hover:scale-110 transition-transform">
                                            <Phone size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Điện thoại</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 pl-11">{staffInfo.so_dien_thoai}</p>
                                </div>
                            )}

                            {/* Email - From Staff Info */}
                            {staffInfo?.email && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group md:col-span-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-red-500 group-hover:scale-110 transition-transform">
                                            <Mail size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Email</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 pl-11">{staffInfo.email}</p>
                                </div>
                            )}

                            {/* Trạng thái - From Staff Info */}
                            {staffInfo?.trang_thai && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group md:col-span-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-teal-500 group-hover:scale-110 transition-transform">
                                            <Activity size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Trạng thái</span>
                                    </div>
                                    <div className="pl-11">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${staffInfo.trang_thai === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {staffInfo.trang_thai}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!staffInfo && !loading && (
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl text-sm font-bold border border-orange-100">
                                <Info size={16} className="inline mr-2" />
                                Chưa cập nhật thông tin chi tiết nhân sự.
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
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
