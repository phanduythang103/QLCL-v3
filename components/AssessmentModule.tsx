import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Search, Filter,
  ChevronRight, ChevronDown, Trash2, Edit2, Eye,
  CheckCircle2, XCircle, RefreshCw, Printer,
  Camera, ClipboardList, ListFilter, Minus
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { fetchData83tc, type Data83tc } from '../readData83tc';
import { fetchDmDonVi, type DmDonVi } from '../readDmDonVi';
import {
  fetchAssessmentSheets,
  fetchKqByPhieuId,
  deletePhieuDanhGia,
  saveKqDanhGia83Bulk,
  type KqDanhGia83,
  type AssessmentSheet
} from '../readKqDanhGia83';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

// --- Helper Functions ---
const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

// --- Component Xem Chi Tiết (Chế độ Page) ---
const AssessmentDetailView = ({ phieuId, data, onClose, sheetInfo }: {
  phieuId: string,
  data: KqDanhGia83[],
  onClose: () => void,
  sheetInfo?: AssessmentSheet
}) => {
  const [expandedTCs, setExpandedTCs] = useState<Record<string, boolean>>({});

  const toggleTC = (tcKey: string) => {
    setExpandedTCs(prev => ({ ...prev, [tcKey]: !prev[tcKey] }));
  };

  const calculateCriteriaLevel = (items: KqDanhGia83[]) => {
    let maxLevel = 1;
    for (let level = 2; level <= 5; level++) {
      const levelItems = items.filter(i => {
         const itemLevelStr = i.nhom || '1';
         const itemLevel = parseInt(itemLevelStr.replace('Mức ', '')) || 1;
         return itemLevel === level;
      });
      if (levelItems.length === 0) continue;

      const allMet = levelItems.every(i => i.dat_muc === 'Đạt' || i.dat_muc === 'Không đánh giá');
      if (allMet) {
        maxLevel = level;
      } else {
        break;
      }
    }
    return maxLevel;
  };

  const hierarchyData = useMemo(() => {
    const hierarchy: any = {};
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col animate-in fade-in duration-500 min-h-[600px]">
      <div className="flex-1 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#059669] text-white flex justify-between items-center shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <Printer size={24} />
            <div>
               {/* Modal Header Title Removed as requested */}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white print:p-0 print:overflow-visible">
          {/* Formal Report Header */}
          <div className="text-center">
            {/* Formal Report Header Removed */}
          </div>

          <div className="flex flex-wrap justify-between gap-6 mb-8 font-bold text-slate-700 text-[13pt]">
            <p>Đơn vị được chấm điểm: <span className="border-b border-dotted border-slate-400 px-2">{sheetInfo?.don_vi_duoc_danh_gia || '---'}</span></p>
            <p>Người chấm điểm: <span className="border-b border-dotted border-slate-400 px-2">{sheetInfo?.nguoi_danh_gia || '---'}</span></p>
            <p>Ngày chấm điểm: <span className="border-b border-dotted border-slate-400 px-2">{sheetInfo ? new Date(sheetInfo.ngay_danh_gia).toLocaleDateString('vi-VN') : '---'}</span></p>
          </div>

          <div className="mb-6">
             <p className="font-black text-[#059669] text-[13pt]">Kết quả: Mức trung bình {sheetInfo?.score || '---'}</p>
          </div>

          {/* Excel-style Table */}
          <div className="overflow-x-auto border border-black">
            <table className="w-full border-collapse text-[12pt] text-left">
              <thead>
                <tr className="bg-slate-50 font-bold uppercase text-center align-middle border-b border-black text-table">
                  <th className="border-r border-black p-2">NỘI DUNG CỦA TIÊU CHÍ VÀ TIỂU MỤC CỤ THỂ</th>
                  <th className="border-r border-black p-2 w-16">Mức</th>
                  <th className="p-0 w-60">
                    <div className="border-b border-black p-1">Đánh giá</div>
                    <div className="flex divide-x divide-black text-[12pt]">
                      <div className="w-20 p-1">Đạt</div>
                      <div className="w-20 p-1">K.Đạt</div>
                      <div className="w-20 p-1">K.ĐG</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                 {Object.keys(hierarchyData).sort(naturalSort).map(phan => (
                   <React.Fragment key={phan}>
                     {/* Phần Row */}
                     <tr className="bg-slate-200 font-bold align-middle border-b border-black">
                       <td className="border-r border-black p-2 uppercase text-table" colSpan={3}>{phan}</td>
                     </tr>

                     {Object.keys(hierarchyData[phan].chuongs).sort(naturalSort).map(chuong => (
                       <React.Fragment key={chuong}>
                         {/* Chương Row */}
                         <tr className="bg-slate-100 font-normal align-middle border-b border-black">
                           <td className="border-r border-black p-2 italic text-table pl-4" colSpan={3}>{chuong}</td>
                         </tr>

                         {Object.keys(hierarchyData[phan].chuongs[chuong].tieuChis).sort(naturalSort).map(tc => {
                           const items = hierarchyData[phan].chuongs[chuong].tieuChis[tc];
                           const isExpanded = expandedTCs[tc];
                           const criteriaLevel = calculateCriteriaLevel(items);

                           return (
                             <React.Fragment key={tc}>
                               {/* Tiêu chí Row (Clickable) */}
                               <tr
                                 onClick={() => toggleTC(tc)}
                                 className="bg-white font-bold align-middle border-b border-black text-[#059669] cursor-pointer hover:bg-green-50 transition-colors"
                               >
                                 <td className="border-r border-black p-2 pl-8 flex items-center gap-3 text-table">
                                   {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                   <span className="uppercase tracking-tight">{tc}</span>
                                 </td>
                                 <td className="border-r border-black p-2 text-center text-[12pt]">{criteriaLevel}</td>
                                 <td className="p-0">
                                   <div className="flex h-full min-h-[44px] divide-x divide-black text-center font-black opacity-20">
                                      <div className="w-20"></div>
                                      <div className="w-20"></div>
                                      <div className="w-20"></div>
                                   </div>
                                 </td>
                               </tr>

                               {/* Sub-items (Tiểu mục) - Shown ONLY if expanded */}
                               {isExpanded && items.map((item: KqDanhGia83) => (
                                 <tr key={item.id} className="align-top border-b border-black last:border-b-0 text-[11pt]">
                                   <td className="border-r border-black p-2 pl-14 leading-relaxed">
                                     <div className="flex gap-2">
                                       <span className="font-bold text-slate-400 shrink-0">
                                         {item.ma_tieu_muc?.split('-').pop() || item.ma_tieu_muc}.
                                       </span>
                                       <span>{item.tieu_muc}</span>
                                     </div>
                                     {item.ghi_chu && (
                                       <div className="mt-2 text-[10pt] text-slate-500 italic bg-slate-50 p-2 rounded ml-6">
                                         Ghi chú minh chứng: {item.ghi_chu}
                                       </div>
                                     )}
                                   </td>
                                   <td className="border-r border-black p-2 text-center font-bold text-slate-400">{item.nhom?.replace('Mức ', '') || '1'}</td>
                                   <td className="p-0 h-full">
                                      <div className="flex h-full min-h-[44px] divide-x divide-black text-center font-black">
                                         <div className="w-20 flex items-center justify-center text-green-600">{item.dat_muc === 'Đạt' ? 'X' : ''}</div>
                                         <div className="w-20 flex items-center justify-center text-red-600">{item.dat_muc === 'Chưa đạt' ? 'X' : ''}</div>
                                         <div className="w-20 flex items-center justify-center text-slate-400">{item.dat_muc === 'Không đánh giá' ? 'X' : ''}</div>
                                      </div>
                                   </td>
                                 </tr>
                               ))}
                             </React.Fragment>
                           );
                         })}
                       </React.Fragment>
                     ))}
                   </React.Fragment>
                 ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-6 shadow-[-4px_0_15px_rgba(0,0,0,0.05)] print:hidden">
          <button
            onClick={onClose}
            className="flex items-center gap-3 px-10 py-3 bg-[#059669] text-white rounded-xl hover:bg-[#007700] font-black transition-all text-xs shadow-lg shadow-green-200 active:scale-95"
          >
            Đóng trang chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

// --- View 1: Quản lý danh mục 83 Tiêu chí ---
const Criteria83Data83View = () => {
  const [data, setData] = useState<Data83tc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhan, setExpandedPhan] = useState<Record<string, boolean>>({ "PHẦN A: HƯỚNG ĐẾN NGƯỜI BỆNH": true });
  const [expandedChuong, setExpandedChuong] = useState<Record<string, boolean>>({ "CHƯƠNG A1: CHỈ DẪN, ĐÓN TIẾP, HƯỚNG DẪN, CẤP CỨU NGƯỜI BỆNH": true });
  const [expandedTieuChi, setExpandedTieuChi] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData83tc().then(setData).finally(() => setLoading(false));
  }, []);

  const hierarchy = useMemo(() => {
    const tree: any = {};
    data.forEach(item => {
      const phan = item.phan || "Khác";
      const chuong = item.chuong || "Khác";
      const tieuChi = item.tieu_chi || "Khác";

      if (!tree[phan]) tree[phan] = { chuongs: {} };
      if (!tree[phan].chuongs[chuong]) tree[phan].chuongs[chuong] = { tieuChis: {} };
      if (!tree[phan].chuongs[chuong].tieuChis[tieuChi]) tree[phan].chuongs[chuong].tieuChis[tieuChi] = { items: [] };

      tree[phan].chuongs[chuong].tieuChis[tieuChi].items.push(item);
    });
    return tree;
  }, [data]);

  const togglePhan = (phan: string) => {
    setExpandedPhan(prev => ({ ...prev, [phan]: !prev[phan] }));
  };

  const toggleChuong = (chuong: string) => {
    setExpandedChuong(prev => ({ ...prev, [chuong]: !prev[chuong] }));
  };

  const toggleTieuChi = (tc: string) => {
    setExpandedTieuChi(prev => ({ ...prev, [tc]: !prev[tc] }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
        <RefreshCw className="animate-spin inline-block text-[#059669] mb-4" size={32} />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Đang tải danh mục 83 tiêu chí...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header Panel */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">Danh mục chi tiết</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Nhấn vào tiêu đề để mở rộng/thu gọn</span>
      </div>

      <div className="p-4 space-y-4">
        {Object.keys(hierarchy).sort(naturalSort).map(phanName => {
          const phan = hierarchy[phanName];
          const isPhanExpanded = expandedPhan[phanName];
          const chuongCount = Object.keys(phan.chuongs).length;

          return (
            <div key={phanName} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
              {/* PHẦN Level */}
              <button
                onClick={() => togglePhan(phanName)}
                className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${isPhanExpanded ? 'bg-green-50/30' : 'bg-white hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  {isPhanExpanded ? <ChevronDown className="text-[#059669]" size={20} /> : <ChevronRight className="text-slate-400" size={20} />}
                  <span className={`font-black text-sm uppercase tracking-tight ${isPhanExpanded ? 'text-[#059669]' : 'text-slate-700'}`}>
                    {phanName}
                  </span>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-md text-[10px] font-black text-slate-500 border border-slate-200">
                  {chuongCount} Chương
                </div>
              </button>

              {isPhanExpanded && (
                <div className="p-4 space-y-3 bg-white border-t border-slate-100">
                  {Object.keys(phan.chuongs).sort(naturalSort).map(chuongName => {
                    const chuong = phan.chuongs[chuongName];
                    const isChuongExpanded = expandedChuong[chuongName];
                    const tieuChis = chuong.tieuChis;

                    return (
                      <div key={chuongName} className="space-y-2">
                        {/* CHƯƠNG Level */}
                        <button
                          onClick={() => toggleChuong(chuongName)}
                          className="w-full flex items-center gap-3 pl-4 py-2 hover:bg-slate-50 rounded-lg transition-colors group"
                        >
                          {isChuongExpanded ? <ChevronDown className="text-[#059669]" size={16} /> : <ChevronRight className="text-slate-400 group-hover:text-[#059669]" size={16} />}
                          <span className={`font-black italic text-xs uppercase tracking-tight text-left ${isChuongExpanded ? 'text-[#059669]' : 'text-slate-600'}`}>
                            {chuongName}
                          </span>
                        </button>

                        {isChuongExpanded && (
                          <div className="pl-12 space-y-2 pb-2">
                            {Object.keys(tieuChis).sort(naturalSort).map(tcName => {
                              const tc = tieuChis[tcName];
                              const isTcExpanded = expandedTieuChi[tcName];
                              return (
                                <div key={tcName} className="overflow-hidden">
                                  {/* TIÊU CHÍ Level */}
                                  <button
                                    onClick={() => toggleTieuChi(tcName)}
                                    className={`w-full group relative border rounded-xl p-4 transition-all duration-200 flex items-center justify-between ${isTcExpanded ? 'bg-[#f0fff4] border-[#059669]/30 shadow-md' : 'bg-[#f8fffa] border-green-100/50 hover:border-[#059669]/30 hover:shadow-md'}`}
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="mt-1 flex items-center gap-1.5 flex-shrink-0">
                                        <div className="w-4 h-4 border-2 border-slate-300 rounded flex items-center justify-center">
                                          {isTcExpanded && <div className="w-2 h-2 bg-[#059669] rounded-sm"></div>}
                                        </div>
                                        {isTcExpanded ? <ChevronDown className="text-[#059669]" size={14} /> : <ChevronRight className="text-slate-400" size={14} />}
                                      </div>
                                      <span className="font-black text-[13px] text-[#059669] uppercase leading-relaxed tracking-tight text-left">
                                        {tcName}
                                      </span>
                                    </div>
                                    <div className="flex-shrink-0 bg-white shadow-sm border border-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 ml-4 whitespace-nowrap">
                                      {tc.items.length} tiểu mục
                                    </div>
                                  </button>

                                  {/* TIỂU MỤC Level (Items) */}
                                  {isTcExpanded && (
                                    <div className="mt-2 ml-10 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                      {tc.items.map((item: Data83tc) => (
                                        <div key={item.id} className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 flex justify-between items-start gap-4 hover:bg-white transition-colors group/item">
                                          <div className="flex gap-3">
                                            <span className="font-mono font-black text-[11px] text-[#059669] bg-white border border-green-100 px-2 py-0.5 rounded shadow-sm">
                                              {item.ma_tieu_muc}
                                            </span>
                                            <p className="text-[12px] font-bold text-slate-600 leading-relaxed group-hover/item:text-black">
                                              {item.tieu_muc}
                                            </p>
                                          </div>
                                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black border border-amber-200 uppercase whitespace-nowrap">
                                            {item.muc}
                                          </span>
                                        </div>
                                      ))}
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
        })}
      </div>
    </div>
  );
};

// --- View 2: Các bộ tiêu chuẩn (Assessment Reports) ---
const BasicStandardsView = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('kq_danh_gia_cl_ks').select('*').order('created_at', { ascending: false });
      setEvaluations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = (id: number) => {
    setTargetDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetDeleteId) return;
    try {
      await supabase.from('kq_danh_gia_cl_ks').delete().eq('id', targetDeleteId);
      setEvaluations(prev => prev.filter(e => e.id !== targetDeleteId));
    } catch (err) {
      alert("Lỗi khi xóa bộ tiêu chuẩn.");
    } finally {
      setIsDeleteModalOpen(false);
      setTargetDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-[12pt]">
        <table className="table-standardized">
          <thead>
            <tr>
              <th>Đơn vị được đánh giá</th>
              <th>Tên bộ tiêu chuẩn</th>
              <th>Ngày đánh giá</th>
              <th className="text-center">Điểm số</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400">Đang tải...</td></tr>
            ) : evaluations.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Chưa có kết quả nào</td></tr>
            ) : (
              evaluations.map(evalItem => (
                <tr key={evalItem.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-black uppercase">{evalItem.don_vi_duoc_danh_gia}</td>
                  <td className="px-6 py-4 text-black font-bold">{evalItem.ten_tieu_chuan}</td>
                  <td className="px-6 py-4 text-slate-500 font-bold">
                    {evalItem.ngay_danh_gia ? new Date(evalItem.ngay_danh_gia).toLocaleDateString('vi-VN') : '---'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-primary-600">{evalItem.diem_so}/100</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleDelete(evalItem.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group" title="Xóa">
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-4 bg-slate-50 text-center flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold uppercase">{evaluations.length} kết quả đánh giá</span>
          <button onClick={loadData} className="text-xs text-primary-600 hover:underline font-black uppercase flex items-center gap-1">
            <RefreshCw size={12} /> Làm mới dữ liệu
          </button>
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa bộ tiêu chuẩn"
        message="Bạn có chắc chắn muốn xóa bộ tiêu chuẩn này không? Toàn bộ dữ liệu liên quan sẽ bị gỡ bỏ."
      />
    </div>
  );
};

// --- View 3: Chấm điểm Tiêu chí CLBV (QualityAssessmentView) ---
const QualityAssessmentView = ({ onViewModeChange }: { onViewModeChange?: (mode: string) => void }) => {
  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin') ||
    user.role.toLowerCase().includes('manager')
  );
  const uDept = user?.department || "";
  const uDeptCode = uDept.split('-')[0].trim();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');

  // Notify parent of view mode changes if callback provided
  useEffect(() => {
    if (onViewModeChange) onViewModeChange(viewMode);
  }, [viewMode, onViewModeChange]);
  const [sheetList, setSheetList] = useState<AssessmentSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [phieuIdToDelete, setPhieuIdToDelete] = useState<string | null>(null);

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
  const [units, setUnits] = useState<DmDonVi[]>([]);

  // Expanded groups
  const [expandedChuong, setExpandedChuong] = useState<string | null>(null);
  const [expandedPhan, setExpandedPhan] = useState<string | null>(null);
  const [expandedTieuChi, setExpandedTieuChi] = useState<string | null>(null);

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

  useEffect(() => { loadSheets(); }, [isAdmin, uDeptCode]);

  useEffect(() => {
    if (isAdmin) {
      fetchDmDonVi().then(setUnits);
    }
  }, [isAdmin]);

  const handleAddNew = async () => {
    setEditingPhieuId(null);
    setResults({});
    setNgayDanhGia(new Date().toISOString().split('T')[0]);
    setDonViDuocDanhGia(uDept);
    await loadCriteriaForAssessment();
    setViewMode('FORM');
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
        const kq = await fetchKqByPhieuId(phieuIdToEdit);
        const newResults: Record<string, Partial<KqDanhGia83>> = {};
        kq.forEach(r => {
          newResults[r.ma_tieu_muc] = {
            dat_muc: r.dat_muc,
            ghi_chu: r.ghi_chu,
            hinh_anh_minh_chung: r.hinh_anh_minh_chung || []
          };
        });
        setResults(newResults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    setViewingPhieuId(sheet.phieu_id);
    try {
      const data = await fetchKqByPhieuId(sheet.phieu_id);
      setViewingData(data);
      setViewMode('DETAIL');
    } catch (err) {
      alert("Lỗi khi tải chi tiết.");
    }
  };

  const handleDeleteSheet = (phieuId: string) => {
    setPhieuIdToDelete(phieuId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSheet = async () => {
    if (!phieuIdToDelete) return;
    setDeletingId(phieuIdToDelete);
    try {
      await deletePhieuDanhGia(phieuIdToDelete);
      setSheetList(prev => prev.filter(s => s.phieu_id !== phieuIdToDelete));
    } catch (err) {
      alert("Lỗi khi xóa phiếu đánh giá.");
    } finally {
      setDeletingId(null);
      setPhieuIdToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleScoreChange = (ma: string, field: string, val: any) => {
    setResults(prev => ({
      ...prev,
      [ma]: { ...prev[ma], [field]: val }
    }));
  };

  const handleSaveAssessment = async () => {
    if (!donViDuocDanhGia) return alert("Vui lòng nhập đơn vị được đánh giá.");
    setSaving(true);
    try {
      const phieuId = editingPhieuId || `83TC-${Date.now()}`;
      const payload: KqDanhGia83[] = criteria
        .filter(c => results[c.ma_tieu_muc!]?.dat_muc)
        .map(c => {
          const res = results[c.ma_tieu_muc!];
          const itemLevelStr = c.muc || '1';
          const itemLevel = parseInt(itemLevelStr.replace('Mức ', '')) || 1;

          return {
            phieu_id: phieuId,
            ngay_danh_gia: ngayDanhGia,
            nguoi_danh_gia: nguoiDanhGia,
            don_vi_duoc_danh_gia: donViDuocDanhGia,
            phan: c.phan || "",
            chuong: c.chuong || "",
            tieu_chi: c.tieu_chi || "",
            ma_tieu_muc: c.ma_tieu_muc!,
            tieu_muc: c.tieu_muc || "",
            nhom: c.muc || "",
            dat_muc: res.dat_muc!,
            dat: res.dat_muc === "Đạt",
            khong_dat: res.dat_muc === "Chưa đạt",
            khong_danh_gia: res.dat_muc === "Không đánh giá",
            ghi_chu: res.ghi_chu || "",
            hinh_anh_minh_chung: res.hinh_anh_minh_chung || [],
            muc_dat_duoc: itemLevel
          };
        });

      if (editingPhieuId) await deletePhieuDanhGia(editingPhieuId);
      await saveKqDanhGia83Bulk(payload);
      alert("Đã lưu phiếu chấm điểm thành công!");
      setViewMode('LIST');
      loadSheets();
    } catch (err) {
      alert("Lỗi khi lưu phiếu chấm điểm.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (ma: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [...(results[ma]?.hinh_anh_minh_chung || [])];
    // This is a placeholder for actual upload logic which depends on export uploadEvidenceImage
    // For now, we assume it's available or implemented in results mapping
    alert("Tính năng tải ảnh đang được xử lý...");
  };

  const removeImage = (ma: string, url: string) => {
    const urls = (results[ma]?.hinh_anh_minh_chung || []).filter(u => u !== url);
    handleScoreChange(ma, 'hinh_anh_minh_chung', urls);
  };

  if (viewMode === 'DETAIL' && viewingPhieuId) {
    return (
      <AssessmentDetailView
        phieuId={viewingPhieuId || ""}
        data={viewingData}
        onClose={() => setViewMode('LIST')}
        sheetInfo={sheetList.find(s => s.phieu_id === viewingPhieuId)}
      />
    );
  }

  if (viewMode === 'LIST') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-[12pt]">
          <div>
            <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
              <FileText className="text-[#059669]" size={24} />
              Danh sách Phiếu đánh giá 83 tiêu chí
            </h3>
            <p className="text-slate-500 font-bold uppercase text-[10px]">Đơn vị: {uDept || 'Tất cả'}</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-[#059669] text-white px-6 py-2.5 rounded-xl hover:bg-[#007700] font-black transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> Tạo chấm điểm mới
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-[12pt]">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#059669] text-white font-black uppercase text-table tracking-widest h-12">
              <tr>
                <th className="px-6 py-4">Ngày đánh giá</th>
                <th className="px-6 py-4">Đơn vị / Người đánh giá</th>
                <th className="px-6 py-4 text-center">Kết kết quả</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">Đang tải danh sách...</td></tr>
              ) : sheetList.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Chưa có dữ liệu.</td></tr>
              ) : (
                sheetList.map((sheet) => (
                  <tr key={sheet.phieu_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {new Date(sheet.ngay_danh_gia).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-black uppercase">{sheet.don_vi_duoc_danh_gia}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{sheet.nguoi_danh_gia}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-[#059669]">
                        {sheet.score > 0 ? `Mức trung bình ${sheet.score}` : 'Chưa đánh giá'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleViewSheet(sheet)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Eye size={18} /></button>
                        {(isAdmin || sheet.nguoi_tao_id === user?.id) && (
                          <>
                            <button onClick={() => handleEditSheet(sheet)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => handleDeleteSheet(sheet.phieu_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group" title="Xóa">
                              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
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

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteSheet}
          title="Xóa phiếu đánh giá"
          message="Bạn có chắc chắn muốn xóa phiếu đánh giá này không? Thao tác này không thể hoàn tác."
          isLoading={!!deletingId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-[12pt]">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 hover:bg-slate-100 rounded-lg uppercase">
            <XCircle size={18} /> Quay lại
          </button>
          <h3 className="text-section font-black text-black uppercase">Phiếu chấm điểm 83 Tiêu chí</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-slate-400 uppercase mr-2">Cỡ chữ bảng:</span>
           <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="p-1 border rounded hover:bg-slate-50"><Minus size={14}/></button>
           <span className="text-xs font-bold w-6 text-center">{fontSize}</span>
           <button onClick={() => setFontSize(f => Math.min(20, f + 1))} className="p-1 border rounded hover:bg-slate-50"><Plus size={14}/></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-[12pt]">
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
          <input
            type="text"
            list="unitsList"
            value={donViDuocDanhGia}
            onChange={e => setDonViDuocDanhGia(e.target.value)}
            placeholder="Chọn đơn vị..."
            className="w-full px-3 py-2 border rounded-lg font-bold text-sm focus:ring-2 focus:ring-[#059669]/20 outline-none"
          />
          <datalist id="unitsList">
            {units.map(u => (
              <option key={u.id} value={`${u.ma_don_vi} - ${u.ten_don_vi}`} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 italic">Đang tải danh mục tiêu chí...</div>
        ) : Object.keys(groupedCriteria).sort(naturalSort).map(phan => {
          const chuongs = groupedCriteria[phan].chuongs;
          return (
            <div key={phan} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setExpandedPhan(expandedPhan === phan ? null : phan)}
                className={`w-full px-5 py-4 flex justify-between items-center font-black text-left uppercase text-sm tracking-wide transition-colors ${expandedPhan === phan ? 'bg-[#059669]/5 text-[#059669]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  {expandedPhan === phan ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span>{phan}</span>
                </div>
              </button>

              {expandedPhan === phan && (
                <div className="p-4 space-y-4 bg-slate-50/20 border-t border-slate-100">
                  {Object.keys(chuongs).sort(naturalSort).map(chuong => {
                    const tieuChis = chuongs[chuong].tieuChis;
                    return (
                      <div key={chuong} className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedChuong(expandedChuong === chuong ? null : chuong)}
                          className={`w-full px-4 py-3 flex justify-between items-center font-bold text-left text-xs transition-colors border-l-4 ${expandedChuong === chuong ? 'border-[#059669] bg-green-50/10 text-[#059669]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            {expandedChuong === chuong ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span>{chuong}</span>
                          </div>
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
                                  </button>

                                  {expandedTieuChi === tc && (
                                    <div className="p-4 bg-white overflow-x-auto">
                                      <table className="w-full text-left border-collapse" style={{ fontSize: `${fontSize}px` }}>
                                        <thead>
                                          <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black">
                                            <th className="px-4 py-2 w-20">Mã TM</th>
                                            <th className="px-4 py-2">Nội dung tiểu mục</th>
                                            <th className="px-4 py-2 w-12 text-center">Mức</th>
                                            <th className="px-4 py-2 w-48 text-right">Đánh giá</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {items.map((item: Data83tc) => {
                                            const res = results[item.ma_tieu_muc!] || {};
                                            return (
                                              <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-[#059669]">{item.ma_tieu_muc}</td>
                                                <td className="px-4 py-3 font-bold text-slate-700 leading-relaxed">{item.tieu_muc}</td>
                                                <td className="px-4 py-3 text-center">
                                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black border border-amber-200 uppercase">{item.muc}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <div className="flex justify-end gap-1">
                                                    {['Đạt', 'Chưa đạt', 'Không đánh giá'].map(m => (
                                                      <button
                                                        key={m}
                                                        onClick={() => handleScoreChange(item.ma_tieu_muc!, 'dat_muc', m)}
                                                        className={`px-3 py-1.5 rounded text-[9px] font-black uppercase border transition-all ${res.dat_muc === m ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                                      >
                                                        {m === 'Không đánh giá' ? 'K.ĐG' : m}
                                                      </button>
                                                    ))}
                                                  </div>
                                                  {res.dat_muc === 'Chưa đạt' && (
                                                    <div className="mt-2 space-y-2">
                                                      <textarea
                                                        placeholder="Ghi chú lỗi..."
                                                        value={res.ghi_chu || ''}
                                                        onChange={e => handleScoreChange(item.ma_tieu_muc!, 'ghi_chu', e.target.value)}
                                                        className="w-full p-2 border border-red-100 rounded text-[10px] focus:ring-1 focus:ring-red-500"
                                                        rows={2}
                                                      />
                                                    </div>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
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
        })}
      </div>

      <div className="flex justify-end bg-white p-6 rounded-xl border border-slate-200 shadow-md">
        <button
          onClick={handleSaveAssessment}
          disabled={saving || loading}
          className="bg-[#059669] text-white px-12 py-3 rounded-xl font-black uppercase text-sm shadow-xl hover:bg-[#007700] transition-all flex items-center gap-3 active:scale-95 disabled:bg-slate-200"
        >
          {saving ? <RefreshCw className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>}
          Lưu phiếu chấm điểm
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteSheet}
        title="Xóa phiếu đánh giá"
        message="Bạn có chắc chắn muốn xóa phiếu đánh giá này không? Thao tác này không thể hoàn tác."
        isLoading={!!deletingId}
      />
    </div>
  );
};

// --- Main Assessment Module ---
export const AssessmentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CRITERIA_83' | 'ASSESSMENT_REPORTS' | 'QUALITY_ASSESSMENT'>('QUALITY_ASSESSMENT');
  const [qualityViewMode, setQualityViewMode] = useState<string>('LIST');

  return (
    <div className="space-y-6">
      {/* Chỉ hiển thị Tab nếu đang ở chế độ danh sách */}
      {qualityViewMode === 'LIST' && (
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('QUALITY_ASSESSMENT')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'QUALITY_ASSESSMENT' ? 'bg-[#059669] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 size={18} /> Chấm điểm 83 Tiêu chí
          </button>
          <button
            onClick={() => setActiveTab('ASSESSMENT_REPORTS')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'ASSESSMENT_REPORTS' ? 'bg-[#059669] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <FileText size={18} /> Các bộ tiêu chuẩn khác
          </button>
          <button
            onClick={() => setActiveTab('CRITERIA_83')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'CRITERIA_83' ? 'bg-[#059669] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <ListFilter size={18} /> Danh mục 83 Tiêu chí
          </button>
        </div>
      )}

      <div className="min-h-[400px]">
        {activeTab === 'CRITERIA_83' && <Criteria83Data83View />}
        {activeTab === 'ASSESSMENT_REPORTS' && <BasicStandardsView />}
        {activeTab === 'QUALITY_ASSESSMENT' && <QualityAssessmentView onViewModeChange={(mode) => setQualityViewMode(mode)} />}
      </div>
    </div>
  );
};