import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, RefreshCw } from 'lucide-react';
import { JCIFallIncident } from '../types';
import { fetchFallIncidents, addFallIncident, updateFallIncident, deleteFallIncident } from '../readJCIIndicators';

interface Props {
  onBack: () => void;
}

export const JCIFallIncidentsModule: React.FC<Props> = ({ onBack }) => {
  const [incidents, setIncidents] = useState<JCIFallIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<JCIFallIncident, 'id' | 'created_at'>>({
    ma_bao_cao: '', thoi_gian_nga: '', khoa_dieu_tri: '', ho_ten_nb: '', nam_sinh: '',
    muc_nguy_co: '', hoan_canh: '', muc_do_ton_thuong: '', can_thiep_truoc_nga: '',
    da_tai_danh_gia: false, da_danh_gia_mt: false, nguoi_tong_hop: '', ghi_chu: ''
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchFallIncidents();
    setIncidents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateFallIncident(editingId, formData);
    } else {
      await addFallIncident(formData);
    }
    setShowForm(false);
    setEditingId(null);
    loadData();
  };

  const handleEdit = (item: JCIFallIncident) => {
    setFormData({
      ma_bao_cao: item.ma_bao_cao || '',
      thoi_gian_nga: item.thoi_gian_nga ? new Date(item.thoi_gian_nga).toISOString().slice(0, 16) : '',
      khoa_dieu_tri: item.khoa_dieu_tri || '', ho_ten_nb: item.ho_ten_nb || '', nam_sinh: item.nam_sinh || '',
      muc_nguy_co: item.muc_nguy_co || '', hoan_canh: item.hoan_canh || '', muc_do_ton_thuong: item.muc_do_ton_thuong || '',
      can_thiep_truoc_nga: item.can_thiep_truoc_nga || '', da_tai_danh_gia: item.da_tai_danh_gia || false,
      da_danh_gia_mt: item.da_danh_gia_mt || false, nguoi_tong_hop: item.nguoi_tong_hop || '', ghi_chu: item.ghi_chu || ''
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      await deleteFallIncident(id);
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
          <h2 className="text-xl font-bold text-slate-800 uppercase">Tỷ suất người bệnh ngã (AOP.02.00)</h2>
        </div>
        {!showForm && (
          <button onClick={() => {
            setFormData({ ma_bao_cao: '', thoi_gian_nga: '', khoa_dieu_tri: '', ho_ten_nb: '', nam_sinh: '', muc_nguy_co: '', hoan_canh: '', muc_do_ton_thuong: '', can_thiep_truoc_nga: '', da_tai_danh_gia: false, da_danh_gia_mt: false, nguoi_tong_hop: '', ghi_chu: '' });
            setEditingId(null);
            setShowForm(true);
          }} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
            <Plus size={18} /> Thêm mới
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Mã báo cáo</label><input type="text" required value={formData.ma_bao_cao} onChange={e => setFormData({...formData, ma_bao_cao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Thời gian ngã</label><input type="datetime-local" required value={formData.thoi_gian_nga} onChange={e => setFormData({...formData, thoi_gian_nga: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Khoa điều trị</label><input type="text" required value={formData.khoa_dieu_tri} onChange={e => setFormData({...formData, khoa_dieu_tri: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Họ tên người bệnh</label><input type="text" required value={formData.ho_ten_nb} onChange={e => setFormData({...formData, ho_ten_nb: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Năm sinh</label><input type="text" value={formData.nam_sinh} onChange={e => setFormData({...formData, nam_sinh: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Mức nguy cơ ngã</label><input type="text" value={formData.muc_nguy_co} onChange={e => setFormData({...formData, muc_nguy_co: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Hoàn cảnh / Địa điểm</label><input type="text" value={formData.hoan_canh} onChange={e => setFormData({...formData, hoan_canh: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Mức độ tổn thương</label><input type="text" value={formData.muc_do_ton_thuong} onChange={e => setFormData({...formData, muc_do_ton_thuong: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Can thiệp trước ngã</label><input type="text" value={formData.can_thiep_truoc_nga} onChange={e => setFormData({...formData, can_thiep_truoc_nga: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.da_tai_danh_gia} onChange={e => setFormData({...formData, da_tai_danh_gia: e.target.checked})} className="w-5 h-5 text-teal-600 rounded" />
                <span className="text-sm font-medium text-slate-700">Đã tái đánh giá</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.da_danh_gia_mt} onChange={e => setFormData({...formData, da_danh_gia_mt: e.target.checked})} className="w-5 h-5 text-teal-600 rounded" />
                <span className="text-sm font-medium text-slate-700">Đã đánh giá môi trường</span>
              </label>
            </div>
            
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Người tổng hợp</label><input type="text" value={formData.nguoi_tong_hop} onChange={e => setFormData({...formData, nguoi_tong_hop: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label><textarea rows={2} value={formData.ghi_chu} onChange={e => setFormData({...formData, ghi_chu: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
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
                  <th className="p-4 border-b border-slate-200">Thời gian</th>
                  <th className="p-4 border-b border-slate-200">Khoa</th>
                  <th className="p-4 border-b border-slate-200">Người bệnh</th>
                  <th className="p-4 border-b border-slate-200">Mức nguy cơ</th>
                  <th className="p-4 border-b border-slate-200">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500"><RefreshCw className="animate-spin mx-auto mb-2" /> Đang tải dữ liệu...</td></tr>
                ) : incidents.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chưa có dữ liệu sự cố ngã</td></tr>
                ) : (
                  incidents.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-teal-700">{item.ma_bao_cao}</td>
                      <td className="p-4">{formatDate(item.thoi_gian_nga)}</td>
                      <td className="p-4">{item.khoa_dieu_tri}</td>
                      <td className="p-4">{item.ho_ten_nb}</td>
                      <td className="p-4">{item.muc_nguy_co}</td>
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
