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

// --- Component Modal Xem Chi Tiết ---
const ViewSheetDetailModal = ({ phieuId, data, onClose, sheetInfo }: {
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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#009900] text-white flex justify-between items-center shadow-md print:hidden">
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
             <p className="font-black text-[#009900] text-[13pt]">Kết quả: Mức trung bình {sheetInfo?.score || '---'}</p>
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
                                 className="bg-white font-bold align-middle border-b border-black text-[#009900] cursor-pointer hover:bg-green-50 transition-colors"
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
            className="flex items-center gap-3 px-10 py-3 bg-[#009900] text-white rounded-xl hover:bg-[#007700] font-black transition-all text-xs shadow-lg shadow-green-200 active:scale-95"
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

  useEffect(() => {
    fetchData83tc().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#009900] text-white font-bold uppercase text-table tracking-widest h-12">
          <tr>
            <th className="px-6 py-4">Mã TM</th>
            <th className="px-6 py-4">Nội dung tiểu mục</th>
            <th className="px-6 py-4 text-center">Mức</th>
            <th className="px-6 py-4">Phụ trách</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-[12pt]">
          {loading ? (
            <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
          ) : (
            data.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-[#009900]">{item.ma_tieu_muc}</td>
                <td className="px-6 py-4 font-bold text-slate-700 leading-relaxed">{item.tieu_muc}</td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-black border border-amber-200 uppercase">{item.muc}</span>
                </td>
                <td className="px-6 py-4 text-slate-500 font-bold">{item.phu_trach}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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

  if (viewMode === 'LIST') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-[12pt]">
          <div>
            <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
              <FileText className="text-[#009900]" size={24} />
              Danh sách Phiếu đánh giá 83 tiêu chí
            </h3>
            <p className="text-slate-500 font-bold uppercase text-[10px]">Đơn vị: {uDept || 'Tất cả'}</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-[#009900] text-white px-6 py-2.5 rounded-xl hover:bg-[#007700] font-black transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> Tạo chấm điểm mới
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-[12pt]">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#009900] text-white font-black uppercase text-table tracking-widest h-12">
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
                      <span className="text-sm font-black text-[#009900]">
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
            className="w-full px-3 py-2 border rounded-lg font-bold text-sm focus:ring-2 focus:ring-[#009900]/20 outline-none" 
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
                className={`w-full px-5 py-4 flex justify-between items-center font-black text-left uppercase text-sm tracking-wide transition-colors ${expandedPhan === phan ? 'bg-[#009900]/5 text-[#009900]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
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
                          className={`w-full px-4 py-3 flex justify-between items-center font-bold text-left text-xs transition-colors border-l-4 ${expandedChuong === chuong ? 'border-[#009900] bg-green-50/10 text-[#009900]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                                                <td className="px-4 py-3 font-mono font-bold text-[#009900]">{item.ma_tieu_muc}</td>
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
          className="bg-[#009900] text-white px-12 py-3 rounded-xl font-black uppercase text-sm shadow-xl hover:bg-[#007700] transition-all flex items-center gap-3 active:scale-95 disabled:bg-slate-200"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('QUALITY_ASSESSMENT')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
            activeTab === 'QUALITY_ASSESSMENT' ? 'bg-[#009900] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={18} /> Chấm điểm 83 Tiêu chí
        </button>
        <button 
          onClick={() => setActiveTab('ASSESSMENT_REPORTS')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
            activeTab === 'ASSESSMENT_REPORTS' ? 'bg-[#009900] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <FileText size={18} /> Các bộ tiêu chuẩn khác
        </button>
        <button 
          onClick={() => setActiveTab('CRITERIA_83')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
            activeTab === 'CRITERIA_83' ? 'bg-[#009900] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <ListFilter size={18} /> Danh mục 83 Tiêu chí
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'CRITERIA_83' && <Criteria83Data83View />}
        {activeTab === 'ASSESSMENT_REPORTS' && <BasicStandardsView />}
        {activeTab === 'QUALITY_ASSESSMENT' && <QualityAssessmentView />}
      </div>
    </div>
  );
};