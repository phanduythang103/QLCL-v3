import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ClipboardList, Award, ChevronRight, FileCheck, Star,
  Upload, Plus, FileSpreadsheet, Search, Filter, Download,
  MoreHorizontal, CheckCircle2, AlertCircle, Paperclip,
  UserPlus, FileText, Printer, Save, Eye, Edit2, Trash2, RefreshCw,
  LayoutGrid, ListFilter, XCircle, ChevronDown, ChevronUp, AlertTriangle,
  Camera, Image as ImageIcon, Type, Minus
} from 'lucide-react';
import {
  fetchBoTieuChuan, BoTieuChuan, deleteBoTieuChuan,
  fetchKetQuaDanhGia, KetQuaDanhGia
} from '../readDanhGiaChatLuong';
import { fetchData83tc, Data83tc, addData83tcBulk } from '../readData83tc';
import { fetchDonVi, saveKqDanhGia83Bulk, uploadEvidenceImage, KqDanhGia83, DonVi, fetchAssessmentSheets, fetchKqByPhieuId, deletePhieuDanhGia, AssessmentSheet } from '../readKqDanhGia83';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';

// --- Helper Functions ---

const naturalSort = (a: any, b: any) => {
  const strA = (a || "").toString();
  const strB = (b || "").toString();
  return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
};

// --- Types ---

type AssessmentTab = 'CRITERIA_83' | 'BASIC' | 'QUALITY_ASSESSMENT';

export const AssessmentModule: React.FC = () => {
  const { canUpdate } = usePermissions();
  const [activeTab, setActiveTab] = useState<AssessmentTab>('CRITERIA_83');

  return (
    <div className="space-y-6">
      {/* Header Section */}

      {/* Tabs Navigation */}
      <div className="bg-slate-100 p-1 rounded-xl inline-flex mb-2">
        <button
          onClick={() => setActiveTab('CRITERIA_83')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-label font-black transition-all ${activeTab === 'CRITERIA_83'
            ? 'bg-white text-[#009900] shadow-sm'
            : 'text-slate-500 hover:text-black font-black'
            }`}
        >
          <Award size={18} />
          Bộ 83 Tiêu chí CLBV
        </button>
        <button
          onClick={() => setActiveTab('BASIC')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-label font-black transition-all ${activeTab === 'BASIC'
            ? 'bg-white text-[#009900] shadow-sm'
            : 'text-slate-500 hover:text-black font-black'
            }`}
        >
          <ClipboardList size={18} />
          Bộ Tiêu chuẩn Cơ bản
        </button>
        <button
          onClick={() => setActiveTab('QUALITY_ASSESSMENT')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-label font-black transition-all ${activeTab === 'QUALITY_ASSESSMENT'
            ? 'bg-white text-[#009900] shadow-sm'
            : 'text-slate-500 hover:text-black font-black'
            }`}
        >
          <FileCheck size={18} />
          Chấm điểm Tiêu chí CLBV
        </button>
      </div>

      {/* Content Rendering */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'CRITERIA_83' && <Criteria83Data83View />}
        {activeTab === 'BASIC' && <BasicStandardsView />}
        {activeTab === 'QUALITY_ASSESSMENT' && <QualityAssessmentView />}
      </div>
    </div>
  );
};

// --- View 1: Bộ 83 Tiêu chí (Kết nối với bảng data83tc) ---
const Criteria83Data83View = () => {
  const [dataList, setDataList] = useState<Data83tc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPhan, setFilterPhan] = useState("");
  const [filterChuong, setFilterChuong] = useState("");
  const [filterNhom, setFilterNhom] = useState("");

  // Expansion States
  const [expandedPhan, setExpandedPhan] = useState<Record<string, boolean>>({});
  const [expandedChuong, setExpandedChuong] = useState<Record<string, boolean>>({});
  const [expandedTieuChi, setExpandedTieuChi] = useState<Record<string, boolean>>({});

  const togglePhan = (p: string) => setExpandedPhan(prev => ({ ...prev, [p]: !prev[p] }));
  const toggleChuong = (c: string) => setExpandedChuong(prev => ({ ...prev, [c]: !prev[c] }));
  const toggleTieuChi = (tc: string) => setExpandedTieuChi(prev => ({ ...prev, [tc]: !prev[tc] }));

  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
  const uDept = user?.department || "";
  const uDeptCode = uDept.split('-')[0].trim();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchData83tc();
      // Apply role-based filtering
      const filtered = isAdmin ? items : items.filter(c => {
        if (!c.phu_trach) return false;
        const assignmentCodes = c.phu_trach.split(',').map(s => s.trim()).filter(Boolean);
        return assignmentCodes.includes(uDeptCode);
      });
      setDataList(filtered);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu từ bảng data83tc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    const list = dataList.filter(item => {
      const matchesSearch = !searchTerm ||
        item.tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ma_tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tieu_chi?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPhan = !filterPhan || item.phan === filterPhan;
      const matchesChuong = !filterChuong || item.chuong === filterChuong;
      const matchesNhom = !filterNhom || (item.phu_trach && item.phu_trach.includes(filterNhom));
      return matchesSearch && matchesPhan && matchesChuong && matchesNhom;
    });
    return list.sort((a, b) => naturalSort(a.ma_tieu_muc || "", b.ma_tieu_muc || ""));
  }, [dataList, searchTerm, filterPhan, filterChuong, filterNhom]);

  // Hierarchical Grouping
  const groupedList = useMemo(() => {
    const hierarchy: any = {};
    filteredData.forEach(item => {
      const p = item.phan || "Khác";
      const c = item.chuong || "Khác";
      const tc = item.tieu_chi || "Khác";
      if (!hierarchy[p]) hierarchy[p] = { chuongs: {} };
      if (!hierarchy[p].chuongs[c]) hierarchy[p].chuongs[c] = { tieuChis: {} };
      if (!hierarchy[p].chuongs[c].tieuChis[tc]) hierarchy[p].chuongs[c].tieuChis[tc] = [];
      hierarchy[p].chuongs[c].tieuChis[tc].push(item);
    });
    return hierarchy;
  }, [filteredData]);

  const uniquePhan = useMemo(() => [...new Set(dataList.map(d => d.phan).filter((p): p is string => !!p))].sort(naturalSort), [dataList]);
  const uniqueChuong = useMemo(() => {
    const listForChuong = filterPhan ? dataList.filter(d => d.phan === filterPhan) : dataList;
    return [...new Set(listForChuong.map(d => d.chuong).filter((c): c is string => !!c))].sort(naturalSort);
  }, [dataList, filterPhan]);
  const uniqueUnits = useMemo(() => {
    const raw = dataList.flatMap(d => (d.phu_trach || '').split(',').map(s => s.trim()).filter(Boolean));
    return [...new Set(raw)].sort();
  }, [dataList]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterPhan("");
    setFilterChuong("");
    setFilterNhom("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
          <LayoutGrid size={18} className="text-[#009900]" />
          <h3 className="text-section font-black text-black uppercase">Bộ lọc danh mục</h3>
          {(searchTerm || filterPhan || filterChuong || filterNhom) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
            >
              <XCircle size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 font-bold">
            <label className="text-label text-black font-bold uppercase flex items-center gap-1.5"><Search size={12} />Tìm kiếm</label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nhập mã, tên tiểu mục..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-input font-bold text-black focus:ring-2 focus:ring-green-500/20" />
          </div>
          <div className="space-y-1.5 font-bold">
            <label className="text-label text-black font-bold uppercase flex items-center gap-1.5"><ListFilter size={12} />Lọc theo Phần</label>
            <select value={filterPhan} onChange={(e) => setFilterPhan(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-input font-bold text-black bg-white">
              <option value="">Tất cả các Phần</option>
              {uniquePhan.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 font-bold">
            <label className="text-label text-black font-bold uppercase flex items-center gap-1.5"><ListFilter size={12} />Lọc theo Chương</label>
            <select value={filterChuong} onChange={(e) => setFilterChuong(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-input font-bold text-black bg-white">
              <option value="">Tất cả các Chương</option>
              {uniqueChuong.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 font-bold">
            <label className="text-label text-black font-bold uppercase flex items-center gap-1.5"><Filter size={12} />Lọc theo Đơn vị phụ trách</label>
            <select value={filterNhom} onChange={(e) => setFilterNhom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-input font-bold text-black bg-white">
              <option value="">Tất cả các Nhóm</option>
              {uniqueUnits.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 italic">Đang tải dữ liệu...</div>
        ) : Object.keys(groupedList).length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">Không tìm thấy dữ liệu phù hợp.</div>
        ) : (
          Object.keys(groupedList).sort(naturalSort).map(phan => (
            <div key={phan} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-green-900/5">
              <button 
                onClick={() => togglePhan(phan)}
                className={`w-full px-6 py-4 flex items-center justify-between font-black text-left uppercase text-sm tracking-wide transition-all ${expandedPhan[phan] ? 'bg-slate-50 text-[#009900]' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-300 ${expandedPhan[phan] ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown size={22} className={expandedPhan[phan] ? 'text-[#009900]' : 'text-slate-400'} />
                  </div>
                  <span className="leading-tight">{phan}</span>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg border border-slate-200">
                    {Object.keys(groupedList[phan].chuongs).length} Chương
                   </span>
                </div>
              </button>

              {expandedPhan[phan] && (
                <div className="p-4 pt-0 space-y-4 border-t border-slate-100 bg-slate-50/20">
                  {Object.keys(groupedList[phan].chuongs).sort(naturalSort).map(chuong => (
                    <div key={chuong} className="bg-white/40 rounded-xl overflow-hidden pt-2">
                       <button 
                        onClick={() => toggleChuong(chuong)}
                        className={`w-full px-6 py-3 flex items-center justify-between font-bold text-left italic uppercase text-xs transition-colors ${expandedChuong[chuong] ? 'text-[#009900]' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <div className="flex items-center gap-3 pl-4 border-l-2 border-[#009900]/20 ml-2">
                           <ChevronDown size={18} className={`transition-transform ${expandedChuong[chuong] ? '' : '-rotate-90'}`} />
                           <span>{chuong}</span>
                        </div>
                      </button>

                      {expandedChuong[chuong] && (
                        <div className="px-6 pb-4 space-y-3 pl-14">
                          {Object.keys(groupedList[phan].chuongs[chuong].tieuChis).sort(naturalSort).map(tc => (
                            <div key={tc} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md group">
                               <button 
                                onClick={() => toggleTieuChi(tc)}
                                className={`w-full px-5 py-4 flex items-center justify-between font-black text-left text-[13px] uppercase tracking-tight transition-colors ${expandedTieuChi[tc] ? 'bg-green-50/50 text-[#009900]' : 'text-slate-700 hover:bg-green-50/30'}`}
                              >
                                <div className="flex items-center gap-4">
                                   <div className={`transition-transform duration-200 ${expandedTieuChi[tc] ? '' : '-rotate-90'}`}>
                                      <ChevronDown size={16} className={expandedTieuChi[tc] ? 'text-[#009900]' : 'text-slate-400'} />
                                   </div>
                                   <span className="leading-snug">{tc}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 group-hover:border-[#009900]/20 transition-all">
                                  {groupedList[phan].chuongs[chuong].tieuChis[tc].length} tiểu mục
                                </span>
                              </button>

                              {expandedTieuChi[tc] && (
                                <div className="p-4 border-t border-slate-100/50 bg-slate-50/10">
                                   <table className="w-full text-xs text-left border-collapse">
                                      <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                          <th className="px-4 py-2 w-24">Mã TM</th>
                                          <th className="px-4 py-2">Nội dung tiểu mục</th>
                                          <th className="px-4 py-2 w-20 text-center">Mức</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {groupedList[phan].chuongs[chuong].tieuChis[tc].map((item: Data83tc, idx: number) => (
                                          <tr key={item.id || idx} className="hover:bg-green-50/10 transition-colors group/row">
                                            <td className="px-4 py-3 font-mono font-black text-[#009900] align-top">{item.ma_tieu_muc}</td>
                                            <td className="px-4 py-3 font-bold text-slate-600 leading-relaxed max-w-[400px]">{item.tieu_muc}</td>
                                            <td className="px-4 py-3 text-center align-top">
                                               <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black border border-amber-200 uppercase">{item.muc}</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                   </table>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};


// --- View 2: Bộ Tiêu chuẩn Cơ bản ---
const BasicStandardsView = () => {
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
  const uDept = user?.department || "";

  const [standards, setStandards] = useState<BoTieuChuan[]>([]);
  const [evaluations, setEvaluations] = useState<KetQuaDanhGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stdData, evalData] = await Promise.all([
        fetchBoTieuChuan(),
        fetchKetQuaDanhGia()
      ]);
      setStandards(stdData);
      
      // Filter evaluations for non-admins
      if (isAdmin) {
        setEvaluations(evalData);
      } else {
        const filtered = evalData.filter(e => 
          e.don_vi_duoc_danh_gia?.toLowerCase().includes(uDept.toLowerCase()) ||
          uDept.toLowerCase().includes(e.don_vi_duoc_danh_gia?.toLowerCase() || "")
        );
        setEvaluations(filtered);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa bộ tiêu chuẩn này?')) {
      try {
        await deleteBoTieuChuan(id);
        loadData();
      } catch (err) {
        console.error('Lỗi xóa:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* List of Standards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-section font-black text-black uppercase">Danh mục Bộ tiêu chuẩn chất lượng</h3>
            <p className="text-table text-black/60 font-bold">Các bộ tiêu chuẩn xây dựng riêng cho từng lĩnh vực.</p>
          </div>
          {canCreate('ASSESSMENT') && (
            <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm">
              <Plus size={16} /> Thêm bộ tiêu chuẩn mới
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#009900] text-white font-black border-b border-[#0d6e39] uppercase text-table h-12">
              <tr>
                <th className="px-6 py-4">Mã & Tên bộ tiêu chuẩn</th>
                <th className="px-6 py-4">Đơn vị phụ trách</th>
                <th className="px-6 py-4">Tần suất đánh giá</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              )}
              {error && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-red-600">{error}</td></tr>
              )}
              {!loading && !error && standards.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Chưa có bộ tiêu chuẩn nào</td></tr>
              )}
              {!loading && !error && standards.map(std => (
                <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-black text-table uppercase">{std.ten_tieu_chuan}</div>
                    <div className="text-table text-black/60 font-mono mt-1">{std.ma_tieu_chuan}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-slate-700">
                      <UserPlus size={14} className="text-black/40" />
                      <span className="text-table font-bold text-black/80">{std.don_vi_phu_trach || 'Chưa phân công'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {std.tan_suat || 'Chưa xác định'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${std.trang_thai === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {std.trang_thai === 'ACTIVE' ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Xem">
                        <Eye size={16} /> <span className="text-xs font-bold">Xem</span>
                      </button>
                      {canUpdate('ASSESSMENT') && (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Sửa">
                          <Edit2 size={16} /> <span className="text-xs font-bold">Sửa</span>
                        </button>
                      )}
                      {canDelete('ASSESSMENT') && (
                        <button
                          onClick={() => handleDelete(std.id!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Xóa"
                        >
                          <Trash2 size={16} /> <span className="text-xs font-bold">Xóa</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-section font-black text-black uppercase">Kết quả chấm điểm gần đây</h3>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Search size={14} /></button>
            <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Filter size={14} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#009900] text-white font-black text-table uppercase border-b border-[#0d6e39] h-12">
              <tr>
                <th className="px-6 py-3">Đơn vị được đánh giá</th>
                <th className="px-6 py-3">Bộ tiêu chuẩn áp dụng</th>
                <th className="px-6 py-3">Ngày đánh giá</th>
                <th className="px-6 py-3 text-center">Điểm số</th>
                <th className="px-6 py-3 text-right">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              )}
              {!loading && evaluations.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Chưa có kết quả đánh giá nào</td></tr>
              )}
              {!loading && evaluations.map(evalItem => (
                <tr key={evalItem.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-black text-black text-table uppercase">{evalItem.don_vi_duoc_danh_gia}</td>
                  <td className="px-6 py-3 text-black font-bold text-table">{evalItem.ten_tieu_chuan}</td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {evalItem.ngay_danh_gia ? new Date(evalItem.ngay_danh_gia).toLocaleDateString('vi-VN') : ''}
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-primary-600">{evalItem.diem_so}/100</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${evalItem.ket_qua === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {evalItem.ket_qua}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 text-center flex justify-between items-center">
          <span className="text-xs text-slate-500">{evaluations.length} kết quả đánh giá</span>
          <button onClick={loadData} className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
            <RefreshCw size={12} /> Làm mới dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
};

// --- View 3: Chấm điểm Tiêu chí CLBV ---
const QualityAssessmentView = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') || 
    user.role.toLowerCase().includes('admin') || 
    user.role.toLowerCase().includes('manager')
  );
  const uDept = user?.department || ""; 
  const uDeptCode = uDept.split('-')[0].trim(); 

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [sheetList, setSheetList] = useState<AssessmentSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Creation/Form State
  const [criteria, setCriteria] = useState<Data83tc[]>([]);
  const [ngayDanhGia, setNgayDanhGia] = useState(new Date().toISOString().split('T')[0]);
  const [nguoiDanhGia, setNguoiDanhGia] = useState(user?.full_name || "");
  const [donViDuocDanhGia, setDonViDuocDanhGia] = useState(uDept);
  const [results, setResults] = useState<Record<string, Partial<KqDanhGia83>>>({});
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState(12);

  const [editingPhieuId, setEditingPhieuId] = useState<string | null>(null);
  const [viewingPhieuId, setViewingPhieuId] = useState<string | null>(null);
  const [viewingData, setViewingData] = useState<KqDanhGia83[]>([]);
  const [units, setUnits] = useState<DonVi[]>([]); // List of all departments for Admin

  // Expanded groups
  const [expandedChuong, setExpandedChuong] = useState<string | null>(null);
  const [expandedPhan, setExpandedPhan] = useState<string | null>(null);
  const [expandedTieuChi, setExpandedTieuChi] = useState<string | null>(null);

  // Grouping criteria for the form (Phần -> Chương -> Tiêu chí)
  const groupedCriteria = useMemo(() => {
    const hierarchy: any = {};
    criteria.forEach(item => {
      const phan = item.phan || "Khác";
      const chuong = item.chuong || "Khác";
      const tieuChi = item.tieu_chi || "Khác";
      if (!hierarchy[phan]) hierarchy[phan] = { chuongs: {} };
      if (!hierarchy[phan].chuongs[chuong]) hierarchy[phan].chuongs[chuong] = { tieuChis: {} };
      if (!hierarchy[phan].chuongs[chuong].tieuChis[tieuChi]) hierarchy[phan].chuongs[chuong].tieuChis[tieuChi] = [];
      hierarchy[phan].chuongs[chuong].tieuChis[tieuChi].push(item);
    });
    return hierarchy;
  }, [criteria]);


  const loadSheets = async () => {
    setLoading(true);
    try {
      const data = await fetchAssessmentSheets();
      if (isAdmin) {
        setSheetList(data);
      } else {
        // Filter by matching department code
        setSheetList(data.filter(s => {
          const sheetDeptCode = (s.don_vi_duoc_danh_gia || "").split('-')[0].trim();
          return sheetDeptCode === uDeptCode;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCriteriaForAssessment = async (phieuIdToEdit?: string) => {
    setLoading(true);
    try {
      const all = await fetchData83tc();
      const filtered = isAdmin ? all : all.filter(c => {
        if (!c.phu_trach) return false;
        const assignmentCodes = c.phu_trach.split(',').map(s => s.trim()).filter(Boolean);
        return assignmentCodes.includes(uDeptCode);
      });
      setCriteria(filtered);

      if (phieuIdToEdit) {
        const savedKq = await fetchKqByPhieuId(phieuIdToEdit);
        const initialResults: any = {};
        savedKq.forEach(r => {
          initialResults[r.ma_tieu_muc] = r;
        });
        setResults(initialResults);
      } else {
        const initialResults: any = {};
        filtered.forEach(c => {
          initialResults[c.ma_tieu_muc!] = {
            ma_tieu_muc: c.ma_tieu_muc!,
            dat_muc: null, // Default to null (unselected)
            ghi_chu: "",
            hinh_anh_minh_chung: []
          };
        });
        setResults(initialResults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'LIST') loadSheets();
    else if (!editingPhieuId) loadCriteriaForAssessment();
  }, [viewMode]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await fetchDonVi();
        setUnits(data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách đơn vị:", err);
      }
    };
    if (isAdmin) loadUnits();
  }, [isAdmin]);

  const handleAddNew = () => {
    setEditingPhieuId(null);
    setResults({});
    setDonViDuocDanhGia(uDept);
    setNguoiDanhGia(user?.full_name || "");
    setViewMode('FORM');
  };

  const handleEditSheet = async (sheet: AssessmentSheet) => {
    setEditingPhieuId(sheet.phieu_id);
    setNgayDanhGia(sheet.ngay_danh_gia);
    setNguoiDanhGia(sheet.nguoi_danh_gia);
    setDonViDuocDanhGia(sheet.don_vi_duoc_danh_gia);
    await loadCriteriaForAssessment(sheet.phieu_id);
    setViewMode('FORM');
  };

  const handleViewSheet = async (sheet: AssessmentSheet) => {
    setLoading(true);
    try {
      const data = await fetchKqByPhieuId(sheet.phieu_id);
      setViewingData(data);
      setViewingPhieuId(sheet.phieu_id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSheet = async (phieuId: string) => {
    if (!phieuId || deletingId) return;

    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ phiếu đánh giá này không? Thao tác này không thể hoàn tác.")) {
      return;
    }

    setDeletingId(phieuId);
    try {
      await deletePhieuDanhGia(phieuId);
      // Success immediate feedback
      setSheetList(prev => prev.filter(s => s.phieu_id !== phieuId));
      alert("Đã xóa phiếu đánh giá thành công.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Có lỗi xảy ra khi xóa phiếu.");
    } finally {
      setDeletingId(null);
      await loadSheets(); // Sync back
    }
  };

  const handleScoreChange = (maTieuMuc: string, field: string, value: any) => {
    setResults(prev => ({
      ...prev,
      [maTieuMuc]: { ...prev[maTieuMuc], [field]: value }
    }));
  };

  const handleImageUpload = async (maTieuMuc: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const publicUrl = await uploadEvidenceImage(files[0]);
      setResults(prev => {
        const current = prev[maTieuMuc] || {};
        const images = current.hinh_anh_minh_chung || [];
        return {
          ...prev,
          [maTieuMuc]: { ...current, hinh_anh_minh_chung: [...images, publicUrl] }
        };
      });
    } catch (err) {
      alert("Lỗi khi tải ảnh lên.");
    }
  };

  const removeImage = (maTieuMuc: string, urlToRemove: string) => {
    setResults(prev => {
      const current = prev[maTieuMuc];
      if (!current) return prev;
      return {
        ...prev,
        [maTieuMuc]: {
          ...current,
          hinh_anh_minh_chung: (current.hinh_anh_minh_chung || []).filter(url => url !== urlToRemove)
        }
      };
    });
  };

  const handleSaveAssessment = async () => {
    if (!ngayDanhGia || !nguoiDanhGia || !donViDuocDanhGia) {
      alert("Vui lòng nhập đầy đủ thông tin Header (Ngày, Người đánh giá, Đơn vị).");
      return;
    }
    // Calculation Logic: Highest Achieved Level per Criteria (Tiêu chí)
    // Rule: Level X achieved ONLY if ALL items in Level X pass.
    const tcResultMap: Record<string, number> = {};
    const criteriaByTcName: Record<string, Data83tc[]> = {};
    criteria.forEach(c => {
      if (!criteriaByTcName[c.tieu_chi!]) criteriaByTcName[c.tieu_chi!] = [];
      criteriaByTcName[c.tieu_chi!].push(c);
    });

    Object.keys(criteriaByTcName).forEach(tcName => {
      const subItems = criteriaByTcName[tcName].sort((a,b) => naturalSort(a.ma_tieu_muc!, b.ma_tieu_muc!));
      let currentAchievedLevel = 1; // Base level is Level 1.
      
      const itemsByLevel: Record<number, Data83tc[]> = {};
      subItems.forEach(si => {
        const lv = parseInt(si.muc || "1");
        if (!itemsByLevel[lv]) itemsByLevel[lv] = [];
        itemsByLevel[lv].push(si);
      });

      // Sequential check for Levels 2 to 5
      for (let lv = 2; lv <= 5; lv++) {
        if (!itemsByLevel[lv]) break;
        const allPassed = itemsByLevel[lv].every(item => results[item.ma_tieu_muc!]?.dat_muc === "Đạt");
        if (allPassed) currentAchievedLevel = lv;
        else break;
      }
      tcResultMap[tcName] = currentAchievedLevel;
    });

    setSaving(true);
    try {
      // Use crypto.randomUUID() for valid UUID (8-4-4-4-12 hex digits)
      const phieuId = editingPhieuId || window.crypto.randomUUID();
      
      // Filter out any criteria that might be missing ma_tieu_muc to avoid database constraint errors
      const validCriteria = criteria.filter(c => c.ma_tieu_muc);

      const payload: KqDanhGia83[] = validCriteria
        .filter(c => results[c.ma_tieu_muc!]?.dat_muc) // ONLY save evaluated items
        .map(c => {
          const res = results[c.ma_tieu_muc!] || {};
          return {
            phieu_id: phieuId,
            ngay_danh_gia: ngayDanhGia,
            nguoi_danh_gia: nguoiDanhGia,
            don_vi_duoc_danh_gia: donViDuocDanhGia,
            nguoi_tao_id: user?.id,
            phan: c.phan || "",
            chuong: c.chuong || "",
            tieu_chi: c.tieu_chi || "",
            ma_tieu_muc: c.ma_tieu_muc!,
            tieu_muc: c.tieu_muc || "",
            nhom: c.muc || "", 
            dat_muc: res.dat_muc!, // Safe now because of filter
            dat: res.dat_muc === "Đạt",
            khong_dat: res.dat_muc === "Chưa đạt",
            khong_danh_gia: res.dat_muc === "Không đánh giá",
            ghi_chu: res.ghi_chu || "",
            hinh_anh_minh_chung: res.hinh_anh_minh_chung || [],
            muc_dat_duoc: tcResultMap[c.tieu_chi!] || 1
          };
        });

      if (editingPhieuId) await deletePhieuDanhGia(editingPhieuId);
      await saveKqDanhGia83Bulk(payload);
      alert("Đã lưu kết quả đánh giá thành công!");
      setViewMode('LIST');
    } catch (err) {
      alert("Lỗi khi lưu kết quả.");
    } finally {
      setSaving(false);
    }
  };

  if (viewMode === 'LIST') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
              <FileText className="text-[#009900]" size={24} />
              Danh sách Phiếu đánh giá 83 tiêu chí
            </h3>
            <p className="text-table text-black/60 font-medium">Lọc theo đơn vị: <span className="text-[#009900] font-bold">{uDept || 'Tất cả'}</span></p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-[#009900] text-white px-6 py-2.5 rounded-xl hover:bg-[#007700] font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> <span>Tạo chấm điểm mới</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#009900] text-white font-black uppercase text-table tracking-widest h-12">
              <tr>
                <th className="px-6 py-4">Ngày đánh giá</th>
                <th className="px-6 py-4">Đơn vị / Người đánh giá</th>
                <th className="px-6 py-4 text-center">Kết quả</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">Đang tải danh sách...</td></tr>
              ) : sheetList.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Chưa có dữ liệu cho đơn vị của bạn.</td></tr>
              ) : (
                sheetList.map((sheet) => (
                  <tr key={sheet.phieu_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {new Date(sheet.ngay_danh_gia).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-black text-table uppercase">{sheet.don_vi_duoc_danh_gia}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{sheet.nguoi_danh_gia}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-[#009900]">
                        {sheet.score > 0 ? `Đạt mức ${sheet.score}` : 'Chưa đánh giá'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleViewSheet(sheet)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Eye size={18} /></button>
                        {(isAdmin || sheet.nguoi_tao_id === user?.id) && (
                          <>
                            <button onClick={() => handleEditSheet(sheet)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                            {deletingId === sheet.phieu_id ? (
                               <div className="p-2 animate-spin"><Trash2 size={18} className="text-slate-300" /></div>
                            ) : (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDeleteSheet(sheet.phieu_id);
                                 }} 
                                 className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                                 title="Xóa phiếu"
                               >
                                 <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                               </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {viewingPhieuId && (
          <ViewSheetDetailModal
            phieuId={viewingPhieuId}
            data={viewingData}
            onClose={() => setViewingPhieuId(null)}
            sheetInfo={sheetList.find(s => s.phieu_id === viewingPhieuId)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 hover:bg-slate-100 rounded-lg">
            <XCircle size={18} /> <span>Quay lại</span>
          </button>
          <h3 className="text-section font-black text-black uppercase">Phiếu chấm điểm 83 Tiêu chí</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400 uppercase mr-2">Cỡ chữ:</span>
           <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="p-1.5 border rounded hover:bg-slate-50"><Minus size={14}/></button>
           <span className="text-xs font-bold w-6 text-center">{fontSize}</span>
           <button onClick={() => setFontSize(f => Math.min(20, f + 1))} className="p-1.5 border rounded hover:bg-slate-50"><Plus size={14}/></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase">Ngày đánh giá</label>
          <input type="date" value={ngayDanhGia} onChange={e => setNgayDanhGia(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-bold text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase">Người đánh giá</label>
          <input type="text" value={nguoiDanhGia} onChange={e => setNguoiDanhGia(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-bold text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase">Đơn vị được đánh giá</label>
          {isAdmin ? (
            <div className="relative group/search">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={14} />
               </div>
               <input 
                type="text" 
                list="unitsList"
                value={donViDuocDanhGia} 
                onChange={e => setDonViDuocDanhGia(e.target.value)}
                placeholder="Chọn hoặc nhập tên đơn vị..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg font-bold text-sm focus:ring-2 focus:ring-[#009900]/20 outline-none transition-all" 
              />
              <datalist id="unitsList">
                {units.map(u => (
                  <option key={u.id} value={`${u.ma_don_vi} - ${u.ten_don_vi}`} />
                ))}
              </datalist>
            </div>
          ) : (
            <input type="text" value={donViDuocDanhGia} readOnly className="w-full px-3 py-2 border rounded-lg font-bold text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 italic">Đang tải danh mục tiêu chí...</div>
        ) : Object.keys(groupedCriteria).length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">Đơn vị của bạn không có tiêu chí nào được phân công.</div>
        ) : (
          Object.keys(groupedCriteria).sort(naturalSort).map(phan => {
            const chuongs = groupedCriteria[phan].chuongs;
            const chuongCount = Object.keys(chuongs).length;
            return (
              <div key={phan} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedPhan(expandedPhan === phan ? null : phan)}
                  className={`w-full px-5 py-4 flex justify-between items-center font-black text-left uppercase text-sm tracking-wide transition-colors ${expandedPhan === phan ? 'bg-[#009900]/5 text-[#009900]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {expandedPhan === phan ? <ChevronDown size={20} className="text-[#009900]" /> : <ChevronRight size={20} className="text-slate-400" />}
                    <span>{phan}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">{chuongCount} chương</span>
                </button>

                {expandedPhan === phan && (
                  <div className="p-4 space-y-4 bg-slate-50/20 border-t border-slate-100">
                    {Object.keys(chuongs).sort(naturalSort).map(chuong => {
                      const tieuChis = chuongs[chuong].tieuChis;
                      const tcCount = Object.keys(tieuChis).length;
                      return (
                        <div key={chuong} className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedChuong(expandedChuong === chuong ? null : chuong)}
                            className={`w-full px-4 py-3 flex justify-between items-center font-bold text-left text-xs transition-colors border-l-4 ${expandedChuong === chuong ? 'border-[#009900] bg-green-50/10 text-[#009900]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-2">
                              {expandedChuong === chuong ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>{chuong}</span>
                            </div>
                            <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold uppercase tracking-tight">{tcCount} tiêu chí</span>
                          </button>

                          {expandedChuong === chuong && (
                            <div className="divide-y divide-slate-50">
                              {Object.keys(tieuChis).sort(naturalSort).map(tc => {
                                const items = tieuChis[tc];
                                return (
                                  <div key={tc} className="p-0 border-t border-slate-50">
                                    <button
                                      onClick={() => setExpandedTieuChi(expandedTieuChi === tc ? null : tc)}
                                      className={`w-full px-6 py-3 flex justify-between items-center font-bold text-left text-[11px] transition-colors ${expandedTieuChi === tc ? 'bg-slate-50 text-slate-800' : 'text-slate-500 hover:bg-white'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {expandedTieuChi === tc ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span>{tc}</span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 font-bold uppercase">{items.length} tiểu mục</span>
                                    </button>

                                    {expandedTieuChi === tc && (
                                      <div className="p-4 bg-white overflow-x-auto">
                                        <div className="min-w-[800px] space-y-4">
                                          <div className="flex bg-slate-50 text-slate-400 uppercase text-[9px] font-black px-4 py-2 rounded-t-lg">
                                            <div className="w-20">Mã TM</div>
                                            <div className="flex-1">Nội dung tiểu mục</div>
                                            <div className="w-12 text-center">Mức</div>
                                            <div className="w-48 text-right">Đánh giá</div>
                                          </div>
                                          <div className="divide-y divide-slate-100">
                                            {(() => {
                                              let stopEvaluation = false;
                                              return items.map((item: Data83tc) => {
                                                if (stopEvaluation) return null;
                                                const res = results[item.ma_tieu_muc!] || {};
                                                if (res.dat_muc === 'Chưa đạt') stopEvaluation = true;
                                                return (
                                                  <div key={item.id} className="py-4 px-4 bg-white hover:bg-slate-50/20 transition-colors">
                                                    <div className="flex items-start gap-4">
                                                      <div className="w-16 font-mono font-bold text-[#009900] text-xs pt-1">{item.ma_tieu_muc}</div>
                                                      <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-4">
                                                          <div className="font-bold text-slate-700 leading-relaxed max-w-2xl" style={{ fontSize: `${fontSize}px` }}>
                                                            {item.tieu_muc}
                                                          </div>
                                                          <div className="flex items-center gap-4">
                                                            <div className="w-10 text-center">
                                                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black border border-amber-200 uppercase">{item.muc}</span>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 whitespace-nowrap bg-slate-50/50 p-1 rounded-lg border border-slate-100">
                                                              <button
                                                                onClick={() => handleScoreChange(item.ma_tieu_muc!, 'dat_muc', 'Đạt')}
                                                                className={`py-1.5 px-3 rounded-md text-[9px] font-black uppercase flex items-center justify-center gap-1 border transition-all ${res.dat_muc === 'Đạt' ? 'bg-[#009900] text-white border-[#009900] shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                                              >
                                                                <CheckCircle2 size={12} /> Đạt
                                                              </button>
                                                              <button
                                                                onClick={() => handleScoreChange(item.ma_tieu_muc!, 'dat_muc', 'Chưa đạt')}
                                                                className={`py-1.5 px-3 rounded-md text-[9px] font-black uppercase flex items-center justify-center gap-1 border transition-all ${res.dat_muc === 'Chưa đạt' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                                              >
                                                                <XCircle size={12} /> Không đạt
                                                              </button>
                                                              <button
                                                                onClick={() => handleScoreChange(item.ma_tieu_muc!, 'dat_muc', 'Không đánh giá')}
                                                                className={`py-1.5 px-3 rounded-md text-[9px] font-black uppercase flex items-center justify-center gap-1 border transition-all ${res.dat_muc === 'Không đánh giá' ? 'bg-slate-500 text-white border-slate-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                                              >
                                                                <Minus size={12} /> K.ĐG
                                                              </button>
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {res.dat_muc === 'Chưa đạt' && (
                                                          <div className="mt-4 p-4 bg-red-50/10 border border-red-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase">
                                                              <ClipboardList size={14} /> Ghi chú lỗi/vấn đề & Hình ảnh minh chứng
                                                            </div>
                                                            <textarea
                                                              placeholder="Mô tả cụ thể lỗi hoặc vấn đề ghi nhận được..."
                                                              value={res.ghi_chu || ''}
                                                              onChange={e => handleScoreChange(item.ma_tieu_muc!, 'ghi_chu', e.target.value)}
                                                              className="w-full p-3 border border-red-100 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white shadow-inner"
                                                              rows={2}
                                                            />
                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                              {(res.hinh_anh_minh_chung || []).map((img: string, i: number) => (
                                                                <div key={i} className="relative group w-16 h-16 border rounded-lg overflow-hidden shadow-md ring-2 ring-white">
                                                                  <img src={img} className="w-full h-full object-cover" />
                                                                  <button 
                                                                    onClick={() => removeImage(item.ma_tieu_muc!, img)} 
                                                                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                  >
                                                                    <XCircle size={12} />
                                                                  </button>
                                                                </div>
                                                              ))}
                                                              <label className="w-16 h-16 border-2 border-dashed border-red-200 rounded-lg flex flex-col items-center justify-center text-red-300 hover:border-red-500 hover:text-red-500 cursor-pointer bg-white transition-all shadow-sm">
                                                                <Camera size={24} />
                                                                <span className="text-[8px] font-black uppercase mt-1">Thêm ảnh</span>
                                                                <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(item.ma_tieu_muc!, e)} />
                                                              </label>
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              });
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end bg-white p-6 rounded-xl border border-slate-200 shadow-md">
        <button 
          onClick={handleSaveAssessment} 
          disabled={saving || loading}
          className="bg-[#009900] text-white px-12 py-3 rounded-xl font-black uppercase text-sm shadow-xl hover:bg-[#007700] transition-all flex items-center gap-3 active:scale-95 disabled:bg-slate-200"
        >
          {saving ? <RefreshCw className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>}
          Lưu phiếu chấm điểm
        </button>
      </div>

       {viewingPhieuId && (
        <ViewSheetDetailModal
          phieuId={viewingPhieuId}
          data={viewingData}
          onClose={() => setViewingPhieuId(null)}
          sheetInfo={sheetList.find(s => s.phieu_id === viewingPhieuId)}
        />
      )}
    </div>
  );
};

// --- Component Modal Xem Chi Tiết (Updated) ---
const ViewSheetDetailModal = ({ phieuId, data, onClose, sheetInfo }: {
  phieuId: string,
  data: KqDanhGia83[],
  onClose: () => void,
  sheetInfo?: AssessmentSheet
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hierarchyData = useMemo(() => {
    const hierarchy: any = {};
    // Only show evaluated items
    const evaluatedData = data.filter(item => 
      item.dat_muc && (
        item.dat_muc === 'Đạt' || 
        item.dat_muc === 'Chưa đạt' || 
        item.dat_muc === 'Không đánh giá'
      )
    );

    evaluatedData.forEach(item => {
      const p = item.phan || "Khác";
      const c = item.chuong || "Khác";
      const tc = item.tieu_chi || "Khác";

      if (!hierarchy[p]) hierarchy[p] = { chuongs: {} };
      if (!hierarchy[p].chuongs[c]) hierarchy[p].chuongs[c] = { tieuChis: {} };
      if (!hierarchy[p].chuongs[c].tieuChis[tc]) hierarchy[p].chuongs[c].tieuChis[tc] = [];

      hierarchy[p].chuongs[c].tieuChis[tc].push(item);
    });
    return hierarchy;
  }, [data]);

  const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="flex-1 flex flex-col h-full">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#009900] text-white flex justify-between items-center shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <Printer size={24} />
            <div>
              <h3 className="font-black text-lg leading-tight uppercase">Trình xem Báo cáo Chấm điểm</h3>
              <p className="text-[10px] text-white/80 font-bold uppercase">Mã phiếu: {phieuId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white print:p-0 print:overflow-visible">
          {/* Formal Report Header */}
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">BẢNG CHẤM ĐIỂM CHẤT LƯỢNG BỆNH VIỆN</h1>
            <p className="text-sm font-bold text-slate-600 italic">(Theo Bộ 83 tiêu chí chất lượng Bệnh viện Việt Nam version 2)</p>
          </div>

          <div className="flex flex-wrap justify-between gap-6 mb-8 text-sm font-bold text-slate-700">
            <p>Đơn vị được chấm điểm: <span className="border-b border-dotted border-slate-400 px-2">{sheetInfo?.don_vi_duoc_danh_gia || '---'}</span></p>
            <p>Người chấm điểm: <span className="border-b border-dotted border-slate-400 px-2">{sheetInfo?.nguoi_danh_gia || '---'}</span></p>
            <p>Ngày chấm điểm: <span className="border-b border-dotted border-slate-400 px-2">{sheetInfo ? new Date(sheetInfo.ngay_danh_gia).toLocaleDateString('vi-VN') : '---'}</span></p>
          </div>

          <div className="mb-6">
             <p className="text-lg font-black text-[#009900]">Kết quả: Mức trung bình {sheetInfo?.score || '---'}</p>
          </div>

          {/* Excel-style Table */}
          <div className="overflow-x-auto border border-black">
            <table className="w-full border-collapse text-[12pt] text-left">
              <thead>
                <tr className="bg-slate-50 font-black uppercase text-center align-middle border-b border-black">
                  <th className="border-r border-black p-2">NỘI DUNG CỦA TIÊU CHÍ VÀ TIỂU MỤC CỤ THỂ</th>
                  <th className="border-r border-black p-2 w-16">Mức</th>
                  <th className="p-0 w-60">
                    <div className="border-b border-black p-1">Đánh giá</div>
                    <div className="flex divide-x divide-black text-[10pt]">
                      <div className="w-20 p-1">Đạt</div>
                      <div className="w-20 p-1">Không đạt</div>
                      <div className="w-20 p-1">Không đánh giá</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {Object.keys(hierarchyData).sort(naturalSort).map(phan => (
                  <React.Fragment key={phan}>
                    {/* Phần Row */}
                    <tr className="bg-slate-200 font-black align-middle border-b border-black">
                      <td className="border-r border-black p-2 uppercase" colSpan={3}>{phan}</td>
                    </tr>

                    {Object.keys(hierarchyData[phan].chuongs).sort(naturalSort).map(chuong => (
                      <React.Fragment key={chuong}>
                        {/* Chương Row */}
                        <tr className="bg-slate-50 font-bold align-middle border-b border-black">
                          <td className="border-r border-black p-2 italic" colSpan={3}>{chuong}</td>
                        </tr>

                        {Object.keys(hierarchyData[phan].chuongs[chuong].tieuChis).sort(naturalSort).map(tc => (
                          <React.Fragment key={tc}>
                            {/* Tiêu chí Row */}
                            <tr className="bg-white font-black align-middle border-b border-black text-[#009900]">
                              <td className="border-r border-black p-2" colSpan={3}>{tc}</td>
                            </tr>

                            {/* Sub-items (Tiểu mục) */}
                            {hierarchyData[phan].chuongs[chuong].tieuChis[tc].map((item: KqDanhGia83) => (
                              <tr key={item.id} className="align-top border-b border-black last:border-b-0">
                                <td className="border-r border-black p-2 leading-relaxed">
                                  <div className="flex gap-2">
                                    <span className="font-bold text-slate-400 shrink-0">
                                      {item.ma_tieu_muc?.split('-')[1]?.split('.')[1] || item.ma_tieu_muc?.split('.').pop()}.
                                    </span>
                                    <span>{item.tieu_muc}</span>
                                  </div>
                                  {item.ghi_chu && (
                                    <div className="mt-2 text-[10pt] text-slate-500 italic bg-slate-50 p-1 rounded">
                                      Ghi chú: {item.ghi_chu}
                                    </div>
                                  )}
                                  {item.hinh_anh_minh_chung && item.hinh_anh_minh_chung.length > 0 && (
                                    <div className="mt-2 flex gap-1 print:hidden">
                                      {item.hinh_anh_minh_chung.map((url, i) => (
                                        <div key={i} className="w-10 h-10 rounded border border-slate-200 overflow-hidden">
                                          <img src={url} alt="Minh chứng" className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="border-r border-black p-2 text-center font-bold">{item.nhom?.replace('Mức ', '') || '1'}</td>
                                <td className="p-0 h-full" colSpan={3}>
                                   <div className="flex h-full min-h-[44px] divide-x divide-black text-center font-black">
                                      <div className="w-20 flex items-center justify-center text-green-600">{item.dat_muc === 'Đạt' ? 'X' : ''}</div>
                                      <div className="w-20 flex items-center justify-center text-red-600">{item.dat_muc === 'Chưa đạt' ? 'X' : ''}</div>
                                      <div className="w-20 flex items-center justify-center text-slate-400">{item.dat_muc === 'Không đánh giá' ? 'X' : ''}</div>
                                   </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-6 shadow-[-4px_0_15px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onClose} 
            className="flex items-center gap-3 px-10 py-3 bg-[#009900] text-white rounded-xl hover:bg-[#007700] font-black transition-all text-xs shadow-lg shadow-green-200 active:scale-95"
          >
            Đóng trang chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};