import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, CheckSquare, ClipboardList, Plus, Search, Filter, TrendingUp, AlertCircle, RefreshCw, X, Check } from 'lucide-react';
import { fetchNkvm, NkvmRecord, addNkvm, updateNkvm, deleteNkvm } from '../readNkvm';
import { fetchDsnKvm, DsnKvmRecord, addDsnKvm, updateDsnKvm, deleteDsnKvm } from '../readDsnKvm';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';

type NKVMTab = 'OVERVIEW' | 'SUPERVISION' | 'LIST';

export const NKVMModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NKVMTab>('OVERVIEW');
  const [records, setRecords] = useState<NkvmRecord[]>([]);
  const [dsRecords, setDsRecords] = useState<DsnKvmRecord[]>([]);
  const [units, setUnits] = useState<DmDonVi[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<DmDonVi[]>([]);
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDsModal, setShowDsModal] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<NkvmRecord>>({});
  const [newDsRecord, setNewDsRecord] = useState<Partial<DsnKvmRecord>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const unitRef = useRef<HTMLDivElement>(null);

  // Initialize newRecord for individual surveillance
  useEffect(() => {
    if (showModal && !isEditMode && !viewOnly) {
      setNewRecord({
        ngay_giam_sat: new Date().toISOString().split('T')[0],
        nguoi_giam_sat: user?.full_name || user?.username || '',
        khoa_duoc_giam_sat: user?.department || '',
        ten_nguoi_benh: '',
        nam_sinh: '',
        ma_hsba: '',
        ngay_phau_thuat: '',
        loai_phau_thuat: '', 
        dau_hieu_lam_sang: '',
        can_thiep: '',
        ket_qua_vi_sinh: '',
        phan_loai_nkvm: '', 
      });
    }
  }, [showModal, user, isEditMode, viewOnly]);

  // Initialize newDsRecord for aggregate reports
  useEffect(() => {
    if (showDsModal && !isEditMode) {
      setNewDsRecord({
        ngay_bao_cao: new Date().toISOString().split('T')[0],
        khoa: user?.department || '',
        tong_so_ca_pt: 0,
        so_ca_nkvm_nong: 0,
        so_ca_nkvm_sau: 0,
        so_ca_nkvm_co_quan: 0,
      });
    }
  }, [showDsModal, user, isEditMode]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [nkvmData, dsData, unitData] = await Promise.all([
        fetchNkvm(),
        fetchDsnKvm(),
        fetchDmDonVi()
      ]);
      setRecords(nkvmData);
      setDsRecords(dsData);
      setUnits(unitData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) {
        setShowUnitSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!newRecord.ten_nguoi_benh || !newRecord.khoa_duoc_giam_sat || !newRecord.nguoi_giam_sat) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc (*)');
      return;
    }

    setLoading(true);
    try {
      const recordToSave = { ...newRecord };
      if (isEditMode && recordToSave.id) {
        await updateNkvm(recordToSave.id, recordToSave);
      } else {
        await addNkvm(recordToSave);
      }
      setShowModal(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDs = async () => {
    if (!newDsRecord.khoa || !newDsRecord.ngay_bao_cao) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc (*)');
      return;
    }

    setLoading(true);
    try {
      const recordToSave = { ...newDsRecord };
      if (isEditMode && recordToSave.id) {
        await updateDsnKvm(recordToSave.id, recordToSave);
      } else {
        await addDsnKvm(recordToSave);
      }
      setShowDsModal(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu dữ liệu thống kê NKVM');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isDs: boolean = false) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
    setLoading(true);
    try {
      if (isDs) {
        await deleteDsnKvm(id);
      } else {
        await deleteNkvm(id);
      }
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const positiveCases = records.filter(r => r.phan_loai_nkvm && r.phan_loai_nkvm.trim() !== '');

  const renderOverview = () => {
    const totalSupervisions = records.length;
    const totalCasesInMonth = positiveCases.length;
    const totalSurgeries = totalSupervisions; // Giả định mỗi lượt giám sát là 1 ca PT được giám sát
    const ssiRate = totalSurgeries > 0 ? ((totalCasesInMonth / totalSurgeries) * 100).toFixed(1) : '0';

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="text-table font-black text-black/40 uppercase mb-2">Tỷ lệ Nhiễm khuẩn vết mổ</h4>
            <div className="flex items-end gap-2">
              <span className="text-title font-black text-blue-600">{ssiRate}%</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-bold">
              <TrendingUp size={14} className="rotate-180" /> Thống kê từ {totalSurgeries} ca phẫu thuật
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
            <h4 className="text-table font-black text-black/40 uppercase mb-2">Tổng số lượt Giám sát</h4>
            <div className="flex items-end gap-2">
              <span className="text-title font-black text-green-600">{totalSupervisions}</span>
              <span className="text-table font-bold text-black/40 mb-1">lượt</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-bold">
              <CheckSquare size={14} /> Dữ liệu ghi nhận
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm">
            <h4 className="text-table font-black text-black/40 uppercase mb-2">Ca mắc mới (NKVM)</h4>
            <div className="flex items-end gap-2">
              <span className="text-title font-black text-amber-600">{totalCasesInMonth < 10 ? `0${totalCasesInMonth}` : totalCasesInMonth}</span>
              <span className="text-table font-bold text-black/40 mb-1">Ca ghi nhận</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 font-bold">
              <AlertCircle size={14} /> Có dấu hiệu lâm sàng
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-label font-black text-black uppercase mb-4 border-b border-slate-100 pb-2">Biểu đồ xu hướng tỷ lệ NKVM (6 tháng gần đây)</h4>
          <div className="h-48 flex items-end gap-4 px-4 overflow-hidden">
            {[1.2, 1.1, 0.9, 1.0, 0.8, parseFloat(ssiRate)].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-[#009900] rounded-t-lg transition-all duration-1000 opacity-80" 
                  style={{ height: `${(val / 2) * 100}%`, minHeight: '10%' }}
                ></div>
                <span className="text-[10px] font-bold text-black/40 uppercase">T.{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSupervision = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm phiếu giám sát..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] transition-all outline-none"
            />
          </div>
        <div className="flex gap-2">
          <button onClick={loadAllData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setIsEditMode(false);
              setViewOnly(false);
              setShowModal(true);
            }}
            className="bg-[#009900] text-white px-4 py-2 rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] flex items-center gap-2 shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none"
          >
            <Plus size={16} /> Ghi nhận giám sát
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#009900] text-white font-black uppercase">
            <tr>
              <th className="p-3">Ngày GS</th>
              <th className="p-3">Người GS</th>
              <th className="p-3">Khoa</th>
              <th className="p-3">Bệnh Nhân</th>
              <th className="p-3 text-center">Phân loại phẫu thuật</th>
              <th className="p-3 text-center">NKVM</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold uppercase">
            {records.map((r, idx) => (
              <tr key={r.id || idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-black/40">{r.ngay_giam_sat ? new Date(r.ngay_giam_sat).toLocaleDateString('vi-VN') : '-'}</td>
                <td className="p-3 text-black/40">{r.nguoi_giam_sat}</td>
                <td className="p-3">{r.khoa_duoc_giam_sat}</td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span>{r.ten_nguoi_benh}</span>
                    <span className="text-[10px] text-black/30 font-medium normal-case">HSBA: {r.ma_hsba}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                    {r.loai_phau_thuat || '-'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {r.phan_loai_nkvm ? (
                     <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700">CÓ NKVM</span>
                  ) : (
                     <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700">KHÔNG</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => {
                        setNewRecord(r);
                        setIsEditMode(false);
                        setViewOnly(true);
                        setShowModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Xem chi tiết"
                    >
                      <Search size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        setNewRecord(r);
                        setIsEditMode(true);
                        setViewOnly(false);
                        setShowModal(true);
                      }}
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title="Sửa"
                    >
                      <ClipboardList size={14} />
                    </button>
                    <button 
                      onClick={() => r.id && handleDelete(r.id, false)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Xóa"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-black/40 italic">Chưa có dữ liệu giám sát</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm phiếu báo cáo..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
            <button onClick={loadAllData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => {
                  setIsEditMode(false);
                  setShowDsModal(true);
              }}
              className="bg-[#009900] text-white px-4 py-2 rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] flex items-center gap-2 shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none"
            >
              <Plus size={16} /> Báo cáo Nhiễm khuẩn
            </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#009900] text-white font-black uppercase text-center">
            <tr>
              <th className="p-3 text-left">Ngày tháng</th>
              <th className="p-3 text-left">Khoa</th>
              <th className="p-3">Tổng số PT</th>
              <th className="p-3">Nông</th>
              <th className="p-3">Sâu</th>
              <th className="p-3">Cơ quan</th>
              <th className="p-3 text-red-200">Tổng NKVM</th>
              <th className="p-3 text-red-200">Tỷ lệ (%)</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold uppercase text-center">
            {dsRecords.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-left text-black/60">{item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : '-'}</td>
                <td className="p-3 text-left text-[#009900]">{item.khoa}</td>
                <td className="p-3 font-mono">{item.tong_so_ca_pt}</td>
                <td className="p-3 font-mono">{item.so_ca_nkvm_nong}</td>
                <td className="p-3 font-mono">{item.so_ca_nkvm_sau}</td>
                <td className="p-3 font-mono">{item.so_ca_nkvm_co_quan}</td>
                <td className="p-3 text-red-600 font-black font-mono text-sm">{item.tong_so_ca_nkvm || 0}</td>
                <td className="p-3 text-red-600 font-black font-mono bg-red-50/50">{item.ty_le_nkvm || 0}%</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => {
                        setNewDsRecord(item);
                        setIsEditMode(true);
                        setShowDsModal(true);
                      }}
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title="Sửa"
                    >
                      <ClipboardList size={14} />
                    </button>
                    <button 
                      onClick={() => item.id && handleDelete(item.id, true)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Xóa"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {dsRecords.length === 0 && !loading && (
              <tr><td colSpan={9} className="p-8 text-center text-black/40 italic">Chưa có dữ liệu danh sách Nhiễm khuẩn</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        {[
          { id: 'OVERVIEW', label: 'Tổng quan', icon: <BarChart2 size={16} /> },
          { id: 'SUPERVISION', label: 'Giám sát NKVM', icon: <CheckSquare size={16} /> },
          { id: 'LIST', label: 'Danh sách NKVM', icon: <ClipboardList size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as NKVMTab)}
            className={`flex items-center gap-2 px-6 py-3 text-table font-black uppercase transition-all relative outline-none ${
              activeTab === tab.id 
                ? 'text-[#009900] border-b-2 border-[#009900]' 
                : 'text-black/40 hover:text-black hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'OVERVIEW' && renderOverview()}
        {activeTab === 'SUPERVISION' && renderSupervision()}
        {activeTab === 'LIST' && renderList()}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl w-full ${viewOnly ? 'max-w-3xl' : 'max-w-4xl'} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#009900] text-white">
              <h3 className="text-table font-black uppercase flex items-center gap-2">
                <CheckSquare size={20} />
                {viewOnly ? 'Hồ sơ Giám sát Nhiễm khuẩn vết mổ' : isEditMode ? 'Cập nhật Giám sát' : 'Ghi nhận Giám sát'}
              </h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors outline-none">
                <X size={20} />
              </button>
            </div>
            
            <div className={`p-6 overflow-y-auto ${viewOnly ? 'bg-slate-50/50' : 'space-y-6'}`}>
              {viewOnly ? (
                // --- KNOWLEDGE BASE / LANDING PAGE VIEW ---
                <div className="space-y-6">
                  {/* Hành chính */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-label font-black text-[#009900] uppercase tracking-wide flex items-center gap-2">
                        1. Thông tin Hành chính
                      </h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày giám sát</span>
                        <span className="font-bold text-slate-800">{newRecord.ngay_giam_sat ? new Date(newRecord.ngay_giam_sat).toLocaleDateString('vi-VN') : '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Người giám sát</span>
                        <span className="font-bold text-slate-800">{newRecord.nguoi_giam_sat || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Khoa/Phòng được giám sát</span>
                        <span className="font-bold text-slate-800">{newRecord.khoa_duoc_giam_sat || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Người bệnh */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-label font-black text-[#009900] uppercase tracking-wide flex items-center gap-2">
                        2. Thông tin Người bệnh
                      </h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Họ tên người bệnh</span>
                        <span className="font-bold text-slate-800 text-base text-blue-700">{newRecord.ten_nguoi_benh || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Năm sinh</span>
                        <span className="font-bold text-slate-800">{newRecord.nam_sinh || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Mã HSBA</span>
                        <span className="font-bold text-slate-800 font-mono">{newRecord.ma_hsba || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày phẫu thuật</span>
                        <span className="font-bold text-slate-800">{newRecord.ngay_phau_thuat ? new Date(newRecord.ngay_phau_thuat).toLocaleDateString('vi-VN') : '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Phân loại phẫu thuật</span>
                        <span className="font-bold text-slate-800 bg-slate-100 w-fit px-2 py-0.5 rounded textxs">{newRecord.loai_phau_thuat || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Giám sát chuyên môn */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-[#009900]">
                    <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-label font-black text-[#009900] uppercase tracking-wide flex items-center gap-2">
                        3. Kết quả Giám sát NKVM
                      </h4>
                    </div>
                    <div className="p-4 space-y-4 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 md:pb-0 md:border-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Dấu hiệu lâm sàng ghi nhận</span>
                          {newRecord.dau_hieu_lam_sang ? (
                            <ul className="list-disc list-inside text-slate-800 font-medium space-y-1 mt-1">
                              {newRecord.dau_hieu_lam_sang.split(',').map((dh, i) => (
                                <li key={i}>{dh.trim()}</li>
                              ))}
                            </ul>
                          ) : <span className="text-slate-400 italic">Không có dấu hiệu</span>}
                        </div>
                        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 md:pb-0 md:border-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Can thiệp y tế</span>
                          {newRecord.can_thiep ? (
                            <ul className="list-disc list-inside text-slate-800 font-medium space-y-1 mt-1">
                              {newRecord.can_thiep.split(',').map((ct, i) => (
                                <li key={i}>{ct.trim()}</li>
                              ))}
                            </ul>
                          ) : <span className="text-slate-400 italic">Không can thiệp</span>}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Kết quả Vi sinh</span>
                          <span className="font-bold text-slate-700">{newRecord.ket_qua_vi_sinh || 'Chưa có kết quả'}</span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg flex items-center justify-between border ${newRecord.phan_loai_nkvm ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                         <span className={`text-label font-black uppercase ${newRecord.phan_loai_nkvm ? 'text-red-800' : 'text-green-800'}`}>Kết luận Nhóm NKVM</span>
                         <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${newRecord.phan_loai_nkvm ? 'bg-red-600 text-white shadow-md' : 'bg-[#009900] text-white'}`}>
                            {newRecord.phan_loai_nkvm || 'Không Nhiễm Khuẩn'}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // --- FORM CHỈNH SỬA / THÊM MỚI ---
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Ngày giám sát *</label>
                      <input 
                        type="date" 
                        value={newRecord.ngay_giam_sat}
                        onChange={e => setNewRecord({...newRecord, ngay_giam_sat: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Người giám sát *</label>
                      <input 
                        type="text" 
                        placeholder="Tên người giám sát..."
                        value={newRecord.nguoi_giam_sat}
                        onChange={e => setNewRecord({...newRecord, nguoi_giam_sat: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1 relative" ref={unitRef}>
                      <label className="text-[10px] font-black uppercase text-black/40">Khoa GS *</label>
                      <input 
                        type="text" 
                        placeholder="Chọn khoa/phòng..."
                        value={newRecord.khoa_duoc_giam_sat}
                        onChange={e => {
                          const val = e.target.value;
                          setNewRecord({...newRecord, khoa_duoc_giam_sat: val});
                          if (val.trim()) {
                            const filtered = units.filter(u => 
                              u.ten_don_vi.toLowerCase().includes(val.toLowerCase()) || 
                              u.ma_don_vi.toLowerCase().includes(val.toLowerCase())
                            );
                            setFilteredUnits(filtered.slice(0, 5));
                            setShowUnitSuggestions(true);
                          } else {
                            setShowUnitSuggestions(false);
                          }
                        }}
                        onFocus={() => {
                          if (newRecord.khoa_duoc_giam_sat) setShowUnitSuggestions(true);
                        }}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                      {showUnitSuggestions && filteredUnits.length > 0 && (
                        <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                          {filteredUnits.map(u => (
                            <button
                              key={u.id}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                              onClick={() => {
                                setNewRecord({...newRecord, khoa_duoc_giam_sat: u.ten_don_vi});
                                setShowUnitSuggestions(false);
                              }}
                            >
                              <span className="text-black/40 mr-2">{u.ma_don_vi}</span>
                              {u.ten_don_vi}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Họ tên NB *</label>
                      <input 
                        type="text" 
                        placeholder="Tên bệnh nhân..."
                        value={newRecord.ten_nguoi_benh}
                        onChange={e => setNewRecord({...newRecord, ten_nguoi_benh: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Năm sinh</label>
                      <input 
                        type="text" 
                        placeholder="VD: 1990"
                        value={newRecord.nam_sinh || ''}
                        onChange={e => setNewRecord({...newRecord, nam_sinh: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Mã HSBA</label>
                      <input 
                        type="text" 
                        placeholder="Mã hồ sơ..."
                        value={newRecord.ma_hsba || ''}
                        onChange={e => setNewRecord({...newRecord, ma_hsba: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Ngày phẫu thuật</label>
                      <input 
                        type="date" 
                        value={newRecord.ngay_phau_thuat || ''}
                        onChange={e => setNewRecord({...newRecord, ngay_phau_thuat: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Loại phẫu thuật</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Sạch', 'Sạch - nhiễm', 'Nhiễm'].map(opt => (
                               <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer">
                                  <input 
                                    type="radio" name="loai_phau_thuat" 
                                    value={opt}
                                    checked={newRecord.loai_phau_thuat === opt}
                                    onChange={e => setNewRecord({...newRecord, loai_phau_thuat: e.target.value})}
                                    className="w-4 h-4 text-[#009900] focus:ring-[#009900]"
                                  />
                                  {opt}
                               </label>
                            ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Dấu hiệu lâm sàng</label>
                        <div className="flex flex-col gap-2">
                            {['Sưng, nóng, đỏ, đau', 'Chảy mủ từ vết mổ', 'Vết mổ hở tự nhiên'].map(opt => {
                              const isChecked = (newRecord.dau_hieu_lam_sang || '').includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={e => {
                                        let current = (newRecord.dau_hieu_lam_sang || '').split(',').filter(Boolean).map(s=>s.trim());
                                        if (e.target.checked) current.push(opt);
                                        else current = current.filter(item => item !== opt);
                                        setNewRecord({...newRecord, dau_hieu_lam_sang: current.join(', ')});
                                      }}
                                      className="w-4 h-4 text-[#009900] focus:ring-[#009900] rounded"
                                    />
                                    {opt}
                                </label>
                              )
                            })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Can thiệp</label>
                        <div className="flex flex-col gap-2">
                            {['Bác sĩ phải mở vết mổ', 'Chọc hút dịch từ vết mổ'].map(opt => {
                              const isChecked = (newRecord.can_thiep || '').includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={e => {
                                        let current = (newRecord.can_thiep || '').split(',').filter(Boolean).map(s=>s.trim());
                                        if (e.target.checked) current.push(opt);
                                        else current = current.filter(item => item !== opt);
                                        setNewRecord({...newRecord, can_thiep: current.join(', ')});
                                      }}
                                      className="w-4 h-4 text-[#009900] focus:ring-[#009900] rounded"
                                    />
                                    {opt}
                                </label>
                              )
                            })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Kết quả vi sinh</label>
                        <input 
                          type="text" 
                          placeholder="Ghi nhận..."
                          value={newRecord.ket_qua_vi_sinh || ''}
                          onChange={e => setNewRecord({...newRecord, ket_qua_vi_sinh: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                        />
                      </div>
                      <div className="space-y-1 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <label className="text-[10px] font-black uppercase text-red-800">Phân loại NKVM</label>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                            {['Nông', 'Sâu', 'Cơ quan - Khoang cơ thể', 'Không NKVM'].map(opt => (
                               <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer text-red-900">
                                  <input 
                                    type="radio" name="phan_loai_nkvm" 
                                    value={opt === 'Không NKVM' ? '' : opt}
                                    checked={(newRecord.phan_loai_nkvm || 'Không NKVM') === opt || (!newRecord.phan_loai_nkvm && opt === 'Không NKVM')}
                                    onChange={e => setNewRecord({...newRecord, phan_loai_nkvm: e.target.value})}
                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                  />
                                  {opt}
                               </label>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-lg text-table font-black uppercase text-slate-500 hover:bg-slate-100 transition-all outline-none"
              >
                Đóng
              </button>
              {!viewOnly && (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-2 bg-[#009900] text-white rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} 
                  {isEditMode ? 'Cập nhật' : 'Lưu dữ liệu'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#009900] text-white">
              <h3 className="text-table font-black uppercase flex items-center gap-2">
                <ClipboardList size={20} />
                {isEditMode ? 'Cập nhật' : 'Thêm mới'} Báo cáo Tổng hợp NKVM
              </h3>
              <button onClick={() => setShowDsModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors outline-none">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black/40">Ngày báo cáo *</label>
                  <input 
                    type="date" 
                    value={newDsRecord.ngay_bao_cao}
                    onChange={e => setNewDsRecord({...newDsRecord, ngay_bao_cao: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                  />
                </div>
                <div className="space-y-1 relative" ref={unitRef}>
                  <label className="text-[10px] font-black uppercase text-black/40">Khoa *</label>
                  <input 
                    type="text" 
                    placeholder="Chọn khoa/phòng..."
                    value={newDsRecord.khoa}
                    onChange={e => {
                      const val = e.target.value;
                      setNewDsRecord({...newDsRecord, khoa: val});
                      if (val.trim()) {
                        const filtered = units.filter(u => 
                          u.ten_don_vi.toLowerCase().includes(val.toLowerCase()) || 
                          u.ma_don_vi.toLowerCase().includes(val.toLowerCase())
                        );
                        setFilteredUnits(filtered.slice(0, 5));
                        setShowUnitSuggestions(true);
                      } else {
                        setShowUnitSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (newDsRecord.khoa) setShowUnitSuggestions(true);
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                  />
                  {showUnitSuggestions && filteredUnits.length > 0 && (
                    <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                      {filteredUnits.map(u => (
                        <button
                          key={u.id}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                          onClick={() => {
                            setNewDsRecord({...newDsRecord, khoa: u.ten_don_vi});
                            setShowUnitSuggestions(false);
                          }}
                        >
                          <span className="text-black/40 mr-2">{u.ma_don_vi}</span>
                          {u.ten_don_vi}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1 md:col-span-4 bg-[#009900]/5 p-3 rounded-lg border border-[#009900]/20 mb-2">
                  <label className="text-[11px] font-black uppercase text-[#009900]">1. Nhập Tổng số ca phẫu thuật *</label>
                  <input 
                    type="number" min="0"
                    value={newDsRecord.tong_so_ca_pt}
                    onChange={e => setNewDsRecord({...newDsRecord, tong_so_ca_pt: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 mt-1 bg-white border border-slate-200 rounded-lg text-table font-black focus:ring-2 focus:ring-[#009900] outline-none text-center text-lg"
                  />
                </div>
                
                <div className="md:col-span-4 mt-2">
                   <label className="text-[11px] font-black uppercase text-black/60">2. Số ca Nhiễm khuẩn (Theo loại)</label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black/40 text-center block">Nông</label>
                  <input 
                    type="number" min="0"
                    value={newDsRecord.so_ca_nkvm_nong}
                    onChange={e => setNewDsRecord({...newDsRecord, so_ca_nkvm_nong: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black/40 text-center block">Sâu</label>
                  <input 
                    type="number" min="0"
                    value={newDsRecord.so_ca_nkvm_sau}
                    onChange={e => setNewDsRecord({...newDsRecord, so_ca_nkvm_sau: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black/40 text-center block">Cơ quan</label>
                  <input 
                    type="number" min="0"
                    value={newDsRecord.so_ca_nkvm_co_quan}
                    onChange={e => setNewDsRecord({...newDsRecord, so_ca_nkvm_co_quan: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none text-center"
                  />
                </div>
                
                <div className="space-y-1 pt-1 md:pt-0">
                  <label className="text-[10px] font-black uppercase text-red-600/80 text-center block">Tổng (Tự tính)</label>
                  <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-table font-black text-red-700 text-center">
                    {(newDsRecord.so_ca_nkvm_nong || 0) + (newDsRecord.so_ca_nkvm_sau || 0) + (newDsRecord.so_ca_nkvm_co_quan || 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setShowDsModal(false)}
                className="px-6 py-2 rounded-lg text-table font-black uppercase text-slate-500 hover:bg-slate-100 transition-all outline-none"
              >
                Đóng
              </button>
              <button 
                  onClick={handleSaveDs}
                  disabled={loading}
                  className="px-8 py-2 bg-[#009900] text-white rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} 
                  {isEditMode ? 'Cập nhật' : 'Lưu dữ liệu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
