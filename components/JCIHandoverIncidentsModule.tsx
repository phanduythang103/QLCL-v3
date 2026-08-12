import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, RefreshCw } from 'lucide-react';
import { JCIHandoverIncident } from '../types';
import { fetchHandoverIncidents, addHandoverIncident, updateHandoverIncident, deleteHandoverIncident } from '../readJCIIndicators';

interface Props {
  onBack: () => void;
}

export const JCIHandoverIncidentsModule: React.FC<Props> = ({ onBack }) => {
  const [incidents, setIncidents] = useState<JCIHandoverIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<JCIHandoverIncident, 'id' | 'created_at'>>({
    ma_bao_cao: '', thoi_gian_su_co: '', thoi_gian_bao_cao: '', khoa_lien_quan: '',
    loai_hinh_ban_giao: '', ho_ten_pid: '', phan_loai_su_co: '', muc_do_nghiem_trong: '',
    da_phan_tich_rca: false, hanh_dong_khac_phuc: '', nguoi_tong_hop: '', ghi_chu: ''
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchHandoverIncidents();
    setIncidents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateHandoverIncident(editingId, formData);
    } else {
      await addHandoverIncident(formData);
    }
    setShowForm(false);
    setEditingId(null);
    loadData();
  };

  const handleEdit = (item: JCIHandoverIncident) => {
    setFormData({
      ma_bao_cao: item.ma_bao_cao || '',
      thoi_gian_su_co: item.thoi_gian_su_co ? new Date(item.thoi_gian_su_co).toISOString().slice(0, 16) : '',
      thoi_gian_bao_cao: item.thoi_gian_bao_cao ? new Date(item.thoi_gian_bao_cao).toISOString().slice(0, 16) : '',
      khoa_lien_quan: item.khoa_lien_quan || '', loai_hinh_ban_giao: item.loai_hinh_ban_giao || '',
      ho_ten_pid: item.ho_ten_pid || '', phan_loai_su_co: item.phan_loai_su_co || '',
      muc_do_nghiem_trong: item.muc_do_nghiem_trong || '', da_phan_tich_rca: item.da_phan_tich_rca || false,
      hanh_dong_khac_phuc: item.hanh_dong_khac_phuc || '', nguoi_tong_hop: item.nguoi_tong_hop || '', ghi_chu: item.ghi_chu || ''
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      await deleteHandoverIncident(id);
      loadData();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 uppercase">Sự cố liên quan bàn giao (IPSG.02.01)</h2>
        </div>
        {!showForm && (
          <button onClick={() => {
            setFormData({ ma_bao_cao: '', thoi_gian_su_co: '', thoi_gian_bao_cao: '', khoa_lien_quan: '', loai_hinh_ban_giao: '', ho_ten_pid: '', phan_loai_su_co: '', muc_do_nghiem_trong: '', da_phan_tich_rca: false, hanh_dong_khac_phuc: '', nguoi_tong_hop: '', ghi_chu: '' });
            setEditingId(null);
            setShowForm(true);
          }} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
            <Plus size={18} /> Thêm mới
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Mã báo cáo</label><input type="text" required value={formData.ma_bao_cao} onChange={e => setFormData({...formData, ma_bao_cao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Thời gian sự cố</label><input type="datetime-local" required value={formData.thoi_gian_su_co} onChange={e => setFormData({...formData, thoi_gian_su_co: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Thời gian báo cáo</label><input type="datetime-local" required value={formData.thoi_gian_bao_cao} onChange={e => setFormData({...formData, thoi_gian_bao_cao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Khoa/Phòng liên quan</label><input type="text" required value={formData.khoa_lien_quan} onChange={e => setFormData({...formData, khoa_lien_quan: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Loại hình bàn giao</label><input type="text" required value={formData.loai_hinh_ban_giao} onChange={e => setFormData({...formData, loai_hinh_ban_giao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Họ tên/PID người bệnh</label><input type="text" required value={formData.ho_ten_pid} onChange={e => setFormData({...formData, ho_ten_pid: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Đến NB / Near-miss</label><input type="text" required value={formData.phan_loai_su_co} onChange={e => setFormData({...formData, phan_loai_su_co: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Mức độ nghiêm trọng</label><input type="text" value={formData.muc_do_nghiem_trong} onChange={e => setFormData({...formData, muc_do_nghiem_trong: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Đã phân tích RCA</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.da_phan_tich_rca} onChange={e => setFormData({...formData, da_phan_tich_rca: e.target.checked})} className="w-5 h-5 text-teal-600 rounded" />
                <span className="text-sm font-medium text-slate-700">Có phân tích RCA</span>
              </label>
            </div>
            
            <div className="lg:col-span-3"><label className="block text-sm font-medium text-slate-700 mb-1">Hành động khắc phục</label><input type="text" value={formData.hanh_dong_khac_phuc} onChange={e => setFormData({...formData, hanh_dong_khac_phuc: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Người tổng hợp</label><input type="text" value={formData.nguoi_tong_hop} onChange={e => setFormData({...formData, nguoi_tong_hop: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div className="lg:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label><input type="text" value={formData.ghi_chu} onChange={e => setFormData({...formData, ghi_chu: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium">Hủy</button>
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-sm font-medium">
              <Save size={18} /> Lưu lại
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="p-4 border-b border-slate-200">Mã BC</th>
                  <th className="p-4 border-b border-slate-200">Thời gian sự cố</th>
                  <th className="p-4 border-b border-slate-200">Khoa liên quan</th>
                  <th className="p-4 border-b border-slate-200">Loại hình</th>
                  <th className="p-4 border-b border-slate-200">Phân loại</th>
                  <th className="p-4 border-b border-slate-200">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500"><RefreshCw className="animate-spin mx-auto mb-2" /> Đang tải dữ liệu...</td></tr>
                ) : incidents.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chưa có dữ liệu sự cố bàn giao</td></tr>
                ) : (
                  incidents.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-teal-700">{item.ma_bao_cao}</td>
                      <td className="p-4">{formatDate(item.thoi_gian_su_co)}</td>
                      <td className="p-4">{item.khoa_lien_quan}</td>
                      <td className="p-4">{item.loai_hinh_ban_giao}</td>
                      <td className="p-4">{item.phan_loai_su_co}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(item.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
