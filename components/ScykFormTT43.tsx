import React, { useState, useEffect } from 'react';
import {
  AlertCircle, CheckCircle2, User, FileText, Activity,
  Clock, ShieldAlert, Send, Hospital, X, Upload, Trash2,
  ChevronDown, ChevronUp, ImageIcon, AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  addBaoCaoScyk,
  updateBaoCaoScyk,
  fetchLatestBaoCaoScykByYear,
  BaoCaoScyk
} from '../readBaoCaoScyk';
import { fetchDmDonVi } from '../readDmDonVi';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';
import { useAuth } from '../contexts/AuthContext';
import { compressFile } from '../utils/compression';


interface ScykFormTT43Props {
  onCancel: () => void;
  onSaved: () => void;
  editingItem?: any;
}

const ScykFormTT43: React.FC<ScykFormTT43Props> = ({ onCancel, onSaved, editingItem }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dmDonVi, setDmDonVi] = useState<any[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>(editingItem?.hinh_anh_minh_chung || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState<Partial<BaoCaoScyk>>({
    nhom_bao_cao: 'Sự cố y khoa',
    hinh_thuc_bao_cao: editingItem?.hinh_thuc_bao_cao || 'Tự nguyện',
    so_bc_ma_scyk: editingItem?.so_bc_ma_scyk || '',
    ngay_bao_cao: editingItem?.ngay_bao_cao || new Date().toISOString().split('T')[0],
    don_vi_bao_cao: editingItem?.don_vi_bao_cao || '',

    // Thông tin người bệnh
    ho_ten_nb: editingItem?.ho_ten_nb || '',
    so_benh_an: editingItem?.so_benh_an || '',
    ngay_sinh: editingItem?.ngay_sinh || '',
    gioi: editingItem?.gioi || 'Nam',

    // Thông tin sự cố
    doi_tuong_xay_ra_sc: editingItem?.doi_tuong_xay_ra_sc || 'Người bệnh',
    khoa_phong: editingItem?.khoa_phong || '',
    vi_tri_cu_the: editingItem?.vi_tri_cu_the || '',
    ngay_xay_ra_sc: editingItem?.ngay_xay_ra_sc || '',
    thoi_gian: editingItem?.thoi_gian || '',
    mo_ta_su_co: editingItem?.mo_ta_su_co || '',

    // Xử lý & Thông báo
    de_xuat_giai_phap_ban_dau: editingItem?.de_xuat_giai_phap_ban_dau || '',
    dieu_tri_xy_ly_ban_dau_da_thuc_hien: editingItem?.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '',
    thong_bao_bs_dieu_tri: editingItem?.thong_bao_bs_dieu_tri || 'Không ghi nhận',
    thong_bao_nguoi_nha: editingItem?.thong_bao_nguoi_nha || 'Không ghi nhận',
    thong_bao_nguoi_benh: editingItem?.thong_bao_nguoi_benh || 'Không ghi nhận',
    ghi_nhan_vao_hsba: editingItem?.ghi_nhan_vao_hsba || 'Không ghi nhận',

    // Đánh giá ban đầu
    phan_loai_ban_dau: editingItem?.phan_loai_ban_dau || 'Đã xảy ra',
    muc_do_anh_huong: editingItem?.muc_do_anh_huong || 'Nhẹ',

    // Thông tin người báo cáo
    ho_ten_nguoi_bc: editingItem?.ho_ten_nguoi_bc || user?.full_name || '',
    nguoi_bao_cao_sdt: editingItem?.nguoi_bao_cao_sdt || '',
    nguoi_bao_cao_email: editingItem?.nguoi_bao_cao_email || '',
    nguoi_bao_cao_doi_tuong: editingItem?.nguoi_bao_cao_doi_tuong || 'Điều dưỡng',
    nguoi_bao_cao_chuc_danh_khac: editingItem?.nguoi_bao_cao_chuc_danh_khac || '',
    trang_thai: editingItem?.trang_thai || 'Mới',
    nhom_su_co: editingItem?.nhom_su_co || 'Khác'
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const units = await fetchDmDonVi();
        setDmDonVi(units || []);

        if (!editingItem && user) {
          const nhanSu = await fetchNhanSuQlcl();
          const currentUserInfo = nhanSu.find(ns => ns.ho_ten === user.full_name);
          if (currentUserInfo) {
            setFormData(prev => ({
              ...prev,
              nguoi_bao_cao_sdt: currentUserInfo.so_dien_thoai || '',
              nguoi_bao_cao_email: currentUserInfo.email || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    initData();
  }, [user, editingItem]);

  const generateNextCode = async (unitCode: string) => {
    if (!unitCode || editingItem) return;
    const currentYear = new Date().getFullYear().toString();
    try {
      const latest = await fetchLatestBaoCaoScykByYear(currentYear);
      let nextSeq = 1;
      if (latest && latest.so_bc_ma_scyk) {
        const parts = latest.so_bc_ma_scyk.split('-');
        if (parts.length >= 4) {
          const lastSeq = parseInt(parts[3]);
          if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }
      }
      const newCode = `SCYK-${currentYear}-${unitCode}-${nextSeq.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, so_bc_ma_scyk: newCode }));
    } catch (err) {
      console.error('Error generating code:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.so_bc_ma_scyk || !formData.don_vi_bao_cao || !formData.ho_ten_nb) {
      alert('Vui lòng điền đầy đủ: Số BC, Đơn vị báo cáo, Họ tên NB');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, nhom_bao_cao: 'Sự cố y khoa', hinh_anh_minh_chung: uploadedImages };
      if (editingItem?.id) {
        await updateBaoCaoScyk(editingItem.id, payload);
      } else {
        await addBaoCaoScyk({ ...payload, trang_thai: 'Mới' });
      }
      setSubmitSuccess(true);
    } catch (err: any) {
      alert('Lỗi khi lưu báo cáo: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setUploadError(null);

    const newUrls: string[] = [];
    const uploadId = formData.so_bc_ma_scyk || `temp_${Date.now()}`;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setUploadError(`File ${file.name} không phải là hình ảnh hợp lệ.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`File ${file.name} vượt quá 5MB.`);
          continue;
        }

        // Nén file trước khi upload
        const compressedFile = await compressFile(file);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${uploadId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('scyk')
          .upload(fileName, compressedFile, { cacheControl: '31536000' });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('scyk')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }
      setUploadedImages(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Lỗi upload ảnh:', err);
      setUploadError('Tải ảnh thất bại: ' + err.message);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    setUploadedImages(prev => prev.filter(url => url !== urlToRemove));
  };

  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Báo cáo thành công</h2>
          <p className="text-gray-500 mb-6 font-medium">Phiếu báo cáo sự cố y khoa của bạn đã được ghi nhận vào hệ thống.</p>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              onSaved();
            }}
            className="btn-primary w-full"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full px-0 md:px-0">
      <div className="max-w-[1400px] w-full mx-auto">

        {/* Header */}
        <div className="bg-[#009900] px-6 py-5 text-white rounded-2xl mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-title uppercase">
                {editingItem ? 'Chỉnh sửa báo cáo sự cố y khoa' : 'Tạo báo cáo sự cố y khoa'}
              </h1>
              <p className="hidden md:block text-green-100 text-xs font-medium mt-0.5">Ban hành kèm theo TT 43/2018/TT-BYT ngày 26/12/2018</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card enterprise-form space-y-4">

          {/* SECTION 1: Thông tin chung */}
          <section className="card">
            <div className="flex items-center space-x-2 border-b pb-2 mb-6 text-blue-600 border-blue-100">
              <FileText className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Thông tin chung</h2>
            </div>

            <div className="form-grid">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Hình thức báo cáo *</label>
                <div className="flex flex-wrap gap-6">
                  {['Tự nguyện', 'Bắt buộc'].map(type => (
                    <label key={type} className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="hinh_thuc_bao_cao"
                        value={type}
                        checked={formData.hinh_thuc_bao_cao === type}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 group-hover:text-blue-600 transition-colors font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Số báo cáo/Mã số sự cố</label>
                <input
                  type="text"
                  name="so_bc_ma_scyk"
                  value={formData.so_bc_ma_scyk}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-gray-50 px-4 py-3 border font-mono font-bold"
                  placeholder="Để trống nếu tự động cấp"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày báo cáo *</label>
                <input
                  type="date"
                  name="ngay_bao_cao"
                  value={formData.ngay_bao_cao}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Đơn vị báo cáo *</label>
                <input
                  type="text"
                  name="don_vi_bao_cao"
                  list="don-vi-list-form"
                  value={formData.don_vi_bao_cao}
                  onChange={(e) => {
                    handleChange(e);
                    const u = dmDonVi.find(d => d.ten_don_vi === e.target.value);
                    if (u) generateNextCode(u.ma_don_vi);
                  }}
                  required
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                  placeholder="Nhập hoặc chọn khoa/phòng báo cáo"
                />
                <datalist id="don-vi-list-form">
                  {dmDonVi.map(u => <option key={u.id} value={u.ten_don_vi}>{u.ten_don_vi}</option>)}
                </datalist>
              </div>
            </div>
          </section>

          {/* SECTION 2: Thông tin người bệnh */}
          <section className="card">
            <div className="flex items-center space-x-2 border-b pb-2 mb-6 text-blue-600 border-blue-200">
              <User className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Thông tin người bệnh</h2>
            </div>

            <div className="form-grid">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Họ và tên</label>
                <input
                  type="text"
                  name="ho_ten_nb"
                  value={formData.ho_ten_nb}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 uppercase font-bold"
                  placeholder="NGUYỄN VĂN A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Số bệnh án</label>
                <input
                  type="text"
                  name="so_benh_an"
                  value={formData.so_benh_an}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Giới tính</label>
                <select
                  name="gioi"
                  value={formData.gioi}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 bg-white font-bold cursor-pointer"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày sinh</label>
                <input
                  type="date"
                  name="ngay_sinh"
                  value={formData.ngay_sinh}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: Thông tin sự cố */}
          <section className="card">
            <div className="flex items-center space-x-2 border-b pb-2 mb-6 text-red-600 border-red-100">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Chi tiết sự cố</h2>
            </div>

            <div className="form-grid">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Đối tượng xảy ra sự cố *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Người bệnh', 'Người nhà/khách', 'Nhân viên y tế', 'Trang thiết bị/CSHT'].map(obj => (
                    <label key={obj} className="flex items-start cursor-pointer group">
                      <input
                        type="radio"
                        name="doi_tuong_xay_ra_sc"
                        value={obj}
                        checked={formData.doi_tuong_xay_ra_sc === obj}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 leading-snug group-hover:text-blue-600 transition-colors font-medium">{obj}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Khoa/Phòng nơi xảy ra</label>
                <input
                  type="text"
                  name="khoa_phong"
                  value={formData.khoa_phong}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                  placeholder="VD: Khoa Hồi sức tích cực"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vị trí cụ thể</label>
                <input
                  type="text"
                  name="vi_tri_cu_the"
                  value={formData.vi_tri_cu_the}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                  placeholder="VD: Nhà vệ sinh buồng bệnh 2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày xảy ra *</label>
                <input
                  type="date"
                  name="ngay_xay_ra_sc"
                  value={formData.ngay_xay_ra_sc}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Thời gian (Giờ:Phút)</label>
                <input
                  type="time"
                  name="thoi_gian"
                  value={formData.thoi_gian}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mô tả ngắn gọn về sự cố *</label>
                <textarea
                  name="mo_ta_su_co"
                  value={formData.mo_ta_su_co}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 italic font-medium"
                  placeholder="Mô tả diễn biến, hiện trạng..."
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: Xử lý và đánh giá */}
          <section className="card">
            <div className="flex items-center space-x-2 border-b border-red-200 pb-2 mb-6 text-red-700">
              <Activity className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Xử lý & Đánh giá ban đầu</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Điều trị / Xử lý ban đầu đã thực hiện</label>
                <textarea
                  name="dieu_tri_xy_ly_ban_dau_da_thuc_hien"
                  value={formData.dieu_tri_xy_ly_ban_dau_da_thuc_hien}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 italic font-medium bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Đề xuất giải pháp ban đầu</label>
                <textarea
                  name="de_xuat_giai_phap_ban_dau"
                  value={formData.de_xuat_giai_phap_ban_dau}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 italic font-medium bg-white"
                />
              </div>

              <div className="overflow-x-auto border rounded-xl bg-white shadow-sm border-slate-200">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px]">Hoạt động thông báo/ghi nhận</th>
                      <th className="px-4 py-4 text-center font-bold text-gray-500 uppercase tracking-widest text-[10px]">Có</th>
                      <th className="px-4 py-4 text-center font-bold text-gray-500 uppercase tracking-widest text-[10px]">Không</th>
                      <th className="px-4 py-4 text-center font-bold text-gray-500 uppercase tracking-widest text-[10px]">Không ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { key: 'thong_bao_bs_dieu_tri', label: 'Thông báo cho BS điều trị/người có trách nhiệm' },
                      { key: 'thong_bao_nguoi_nha', label: 'Thông báo cho người nhà/người bảo hộ' },
                      { key: 'thong_bao_nguoi_benh', label: 'Thông báo cho người bệnh' },
                      { key: 'ghi_nhan_vao_hsba', label: 'Ghi nhận vào HSBA/giấy tờ liên quan' }
                    ].map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-gray-700 font-medium">{row.label}</td>
                        {['Có', 'Không', 'Không ghi nhận'].map((option) => (
                          <td key={option} className="px-4 py-4 text-center">
                            <input
                              type="radio"
                              name={row.key}
                              value={option}
                              checked={formData[row.key as keyof BaoCaoScyk] === option}
                              onChange={handleChange}
                              className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-grid card">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Phân loại ban đầu</label>
                  <div className="flex flex-wrap gap-6">
                    {['Chưa xảy ra', 'Đã xảy ra'].map(type => (
                      <label key={type} className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="phan_loai_ban_dau"
                          value={type}
                          checked={formData.phan_loai_ban_dau === type}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700 font-medium group-hover:text-blue-600 transition-colors">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Đánh giá mức độ ảnh hưởng</label>
                  <div className="flex flex-wrap gap-4">
                    {['Nặng', 'Trung bình', 'Nhẹ'].map(type => (
                      <label key={type} className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="muc_do_anh_huong"
                          value={type}
                          checked={formData.muc_do_anh_huong === type}
                          onChange={handleChange}
                          className={`w-4 h-4 focus:ring-blue-500 ${type === 'Nặng' ? 'text-red-600' : type === 'Trung bình' ? 'text-orange-500' : 'text-blue-600'
                            }`}
                        />
                        <span className={`ml-2 font-bold transition-colors ${type === 'Nặng' ? 'text-red-600 group-hover:text-red-700' :
                          type === 'Trung bình' ? 'text-orange-600 group-hover:text-orange-700' :
                            'text-blue-600 group-hover:text-blue-700'
                          }`}>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: Hình ảnh minh chứng */}
          <section className="card">
            <div className="flex items-center space-x-2 border-b pb-2 mb-6 text-violet-600 border-violet-100">
              <ImageIcon className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Hình ảnh minh chứng</h2>
            </div>

            <div className="space-y-4">
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-violet-50 hover:border-violet-400 transition-all group cursor-pointer bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-slate-400 group-hover:text-violet-500 group-hover:scale-110 transition-all mb-4">
                  {uploadingImages ? (
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
                  ) : (
                    <Upload size={32} />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1 pointer-events-none">
                  {uploadingImages ? 'Đang tải lên...' : 'Bấm hoặc kéo thả ảnh vào đây'}
                </h4>
                <p className="text-xs text-slate-400 font-medium pointer-events-none">Hỗ trợ JPG, PNG, GIF (Tối đa 5MB/ảnh)</p>
              </div>

              {uploadError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertTriangle size={18} /> {uploadError}
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                  {uploadedImages.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm ring-1 ring-black/5">
                      <img src={url} alt={`Minh chứng ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 hover:scale-110 transition-all transform shrink-0 shadow-xl"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: Thông tin người báo cáo */}
          <section className="card">
            <div className="flex items-center space-x-2 border-b pb-2 mb-6 text-blue-600 border-blue-100">
              <User className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Thông tin người báo cáo</h2>
            </div>

            <div className="form-grid">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Họ tên người báo cáo *</label>
                <input
                  type="text"
                  name="ho_ten_nguoi_bc"
                  value={formData.ho_ten_nguoi_bc}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  name="nguoi_bao_cao_sdt"
                  value={formData.nguoi_bao_cao_sdt}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  name="nguoi_bao_cao_email"
                  value={formData.nguoi_bao_cao_email}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Chức danh / Đối tượng</label>
                <select
                  name="nguoi_bao_cao_doi_tuong"
                  value={formData.nguoi_bao_cao_doi_tuong}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 bg-white font-bold cursor-pointer"
                >
                  <option value="Điều dưỡng">Điều dưỡng</option>
                  <option value="Bác sỹ">Bác sỹ</option>
                  <option value="Người bệnh">Người bệnh</option>
                  <option value="Người nhà/khách">Người nhà/khách đến thăm</option>
                  <option value="Người chứng kiến 1">Người chứng kiến 1</option>
                  <option value="Người chứng kiến 2">Người chứng kiến 2</option>
                  <option value="Khác">Khác (ghi cụ thể bên dưới)</option>
                </select>

                {formData.nguoi_bao_cao_doi_tuong === 'Khác' && (
                  <input
                    type="text"
                    name="nguoi_bao_cao_chuc_danh_khac"
                    value={formData.nguoi_bao_cao_chuc_danh_khac}
                    onChange={handleChange}
                    placeholder="Ghi rõ chức danh/đối tượng..."
                    className="w-full mt-3 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 border px-4 py-3 font-bold"
                  />
                )}
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="pt-10 border-t flex flex-col sm:flex-row justify-end items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-8 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Đang xử lý...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gửi báo cáo
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ScykFormTT43;
