import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, RefreshCw } from 'lucide-react';
import { JCICriticalResult } from '../types';
import { fetchCriticalResults, addCriticalResult, updateCriticalResult, deleteCriticalResult } from '../readJCIIndicators';

interface Props {
  onBack: () => void;
}

export const JCICriticalResultsModule: React.FC<Props> = ({ onBack }) => {
  const [results, setResults] = useState<JCICriticalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<JCICriticalResult, 'id' | 'created_at'>>({
    thoi_gian_co_kq: '', thoi_gian_thong_bao: '', khoa_thong_bao: '', ho_ten_nb: '', nam_sinh: '',
    pid: '', khoa_dieu_tri: '', ten_kq_bao_dong: '', gia_tri_kq: '', nguoi_thong_bao: '',
    nguoi_nhan_thong_bao: '', xac_nhan_read_back: '', dat_khung_tg: false, ghi_chu: ''
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchCriticalResults();
    setResults(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCriticalResult(editingId, formData);
    } else {
      await addCriticalResult(formData);
    }
    setShowForm(false);
    setEditingId(null);
    loadData();
  };

  const handleEdit = (item: JCICriticalResult) => {
    setFormData({
      thoi_gian_co_kq: item.thoi_gian_co_kq ? new Date(item.thoi_gian_co_kq).toISOString().slice(0, 16) : '',
      thoi_gian_thong_bao: item.thoi_gian_thong_bao ? new Date(item.thoi_gian_thong_bao).toISOString().slice(0, 16) : '',
      khoa_thong_bao: item.khoa_thong_bao || '', ho_ten_nb: item.ho_ten_nb || '', nam_sinh: item.nam_sinh || '',
      pid: item.pid || '', khoa_dieu_tri: item.khoa_dieu_tri || '', ten_kq_bao_dong: item.ten_kq_bao_dong || '',
      gia_tri_kq: item.gia_tri_kq || '', nguoi_thong_bao: item.nguoi_thong_bao || '', nguoi_nhan_thong_bao: item.nguoi_nhan_thong_bao || '',
      xac_nhan_read_back: item.xac_nhan_read_back || '', dat_khung_tg: item.dat_khung_tg || false, ghi_chu: item.ghi_chu || ''
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      await deleteCriticalResult(id);
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
          <h2 className="text-xl font-bold text-slate-800 uppercase">Thông báo KQ báo động CLS (IPSG.02.00)</h2>
        </div>
        {!showForm && (
          <button onClick={() => {
            setFormData({ thoi_gian_co_kq: '', thoi_gian_thong_bao: '', khoa_thong_bao: '', ho_ten_nb: '', nam_sinh: '', pid: '', khoa_dieu_tri: '', ten_kq_bao_dong: '', gia_tri_kq: '', nguoi_thong_bao: '', nguoi_nhan_thong_bao: '', xac_nhan_read_back: '', dat_khung_tg: false, ghi_chu: '' });
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
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Thời gian có KQ</label><input type="datetime-local" required value={formData.thoi_gian_co_kq} onChange={e => setFormData({...formData, thoi_gian_co_kq: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Thời gian báo thành công</label><input type="datetime-local" value={formData.thoi_gian_thong_bao} onChange={e => setFormData({...formData, thoi_gian_thong_bao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Khoa thông báo</label><input type="text" required value={formData.khoa_thong_bao} onChange={e => setFormData({...formData, khoa_thong_bao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Họ tên người bệnh</label><input type="text" required value={formData.ho_ten_nb} onChange={e => setFormData({...formData, ho_ten_nb: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Năm sinh</label><input type="text" value={formData.nam_sinh} onChange={e => setFormData({...formData, nam_sinh: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Mã bệnh án (PID)</label><input type="text" value={formData.pid} onChange={e => setFormData({...formData, pid: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Khoa điều trị (nhận)</label><input type="text" required value={formData.khoa_dieu_tri} onChange={e => setFormData({...formData, khoa_dieu_tri: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Tên KQ báo động</label><input type="text" required value={formData.ten_kq_bao_dong} onChange={e => setFormData({...formData, ten_kq_bao_dong: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Giá trị kết quả</label><input type="text" required value={formData.gia_tri_kq} onChange={e => setFormData({...formData, gia_tri_kq: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Người thông báo</label><input type="text" value={formData.nguoi_thong_bao} onChange={e => setFormData({...formData, nguoi_thong_bao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Người nhận thông báo</label><input type="text" value={formData.nguoi_nhan_thong_bao} onChange={e => setFormData({...formData, nguoi_nhan_thong_bao: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận read-back</label><input type="text" value={formData.xac_nhan_read_back} onChange={e => setFormData({...formData, xac_nhan_read_back: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.dat_khung_tg} onChange={e => setFormData({...formData, dat_khung_tg: e.target.checked})} className="w-5 h-5 text-teal-600 rounded" />
                <span className="text-sm font-medium text-slate-700">Đạt khung thời gian (≤ 15 phút)</span>
              </label>
            </div>
            <div className="lg:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (leo thang)</label><textarea rows={2} value={formData.ghi_chu} onChange={e => setFormData({...formData, ghi_chu: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" /></div>
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
                  <th className="p-4 border-b border-slate-200">Thời gian báo</th>
                  <th className="p-4 border-b border-slate-200">Người bệnh (PID)</th>
                  <th className="p-4 border-b border-slate-200">Khoa nhận</th>
                  <th className="p-4 border-b border-slate-200">Tên KQ</th>
                  <th className="p-4 border-b border-slate-200">Đạt Hạn</th>
                  <th className="p-4 border-b border-slate-200">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500"><RefreshCw className="animate-spin mx-auto mb-2" /> Đang tải dữ liệu...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chưa có dữ liệu thông báo báo động</td></tr>
                ) : (
                  results.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">{formatDate(item.thoi_gian_thong_bao)}</td>
                      <td className="p-4 font-medium text-slate-800">{item.ho_ten_nb} <span className="text-slate-400 font-normal">({item.pid})</span></td>
                      <td className="p-4">{item.khoa_dieu_tri}</td>
                      <td className="p-4 font-medium text-red-600">{item.ten_kq_bao_dong}: {item.gia_tri_kq}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${item.dat_khung_tg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.dat_khung_tg ? 'Đạt' : 'Không'}
                        </span>
                      </td>
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
