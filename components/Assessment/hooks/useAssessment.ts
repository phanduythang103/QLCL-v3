import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { assessmentService } from '../services';
import { 
  ViewMode, ActiveTab, AssessmentSheet, 
  KqDanhGia83, Data83tc, DmDonVi 
} from '../types';

const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

export const useAssessment = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') || 
    user.role.toLowerCase().includes('admin') || 
    user.role.toLowerCase().includes('manager')
  );
  const uDept = user?.department || ""; 
  const uDeptCode = uDept.split('-')[0].trim();

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('QUALITY_ASSESSMENT');
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [sheetList, setSheetList] = useState<AssessmentSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [criteria, setCriteria] = useState<Data83tc[]>([]);
  const [results, setResults] = useState<Record<string, Partial<KqDanhGia83>>>({});
  const [editingPhieuId, setEditingPhieuId] = useState<string | null>(null);
  const [viewingPhieuId, setViewingPhieuId] = useState<string | null>(null);
  const [viewingData, setViewingData] = useState<KqDanhGia83[]>([]);
  const [units, setUnits] = useState<DmDonVi[]>([]);
  const [fontSize, setFontSize] = useState(12);

  // Form State
  const [ngayDanhGia, setNgayDanhGia] = useState(new Date().toISOString().split('T')[0]);
  const [nguoiDanhGia, setNguoiDanhGia] = useState(user?.full_name || "");
  const [donViDuocDanhGia, setDonViDuocDanhGia] = useState(uDept);

  // Expanded Groups
  const [expandedPhan, setExpandedPhan] = useState<string | null>(null);
  const [expandedChuong, setExpandedChuong] = useState<string | null>(null);
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

  const loadSheets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assessmentService.fetchSheets();
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
  }, [isAdmin, uDeptCode]);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  useEffect(() => {
    if (isAdmin) {
      assessmentService.fetchUnits().then(setUnits);
    }
  }, [isAdmin]);

  const loadCriteriaForAssessment = async (phieuIdToEdit?: string) => {
    setLoading(true);
    try {
      const all = await assessmentService.fetchCriteria();
      const filtered = isAdmin ? all : all.filter(c => {
        if (!c.phu_trach) return false;
        const assignmentCodes = c.phu_trach.split(',').map(s => s.trim()).filter(Boolean);
        return assignmentCodes.includes(uDeptCode);
      });
      setCriteria(filtered);

      if (phieuIdToEdit) {
        const kq = await assessmentService.fetchResultsByPhieuId(phieuIdToEdit);
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

  const handleAddNew = async () => {
    setEditingPhieuId(null);
    setResults({});
    setNgayDanhGia(new Date().toISOString().split('T')[0]);
    setDonViDuocDanhGia(uDept);
    await loadCriteriaForAssessment();
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
    setViewingPhieuId(sheet.phieu_id);
    try {
      const data = await assessmentService.fetchResultsByPhieuId(sheet.phieu_id);
      setViewingData(data);
      setViewMode('DETAIL');
    } catch (err) {
      alert("Lỗi khi tải chi tiết.");
    }
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

      if (editingPhieuId) await assessmentService.deleteSheet(editingPhieuId);
      await assessmentService.saveResultsBulk(payload);
      alert("Đã lưu phiếu chấm điểm thành công!");
      setViewMode('LIST');
      loadSheets();
    } catch (err) {
      alert("Lỗi khi lưu phiếu chấm điểm.");
    } finally {
      setSaving(false);
    }
  };

  return {
    isAdmin, user, uDept, uDeptCode,
    activeTab, setActiveTab,
    viewMode, setViewMode,
    sheetList, loading, saving,
    groupedCriteria, criteria, results, setResults,
    editingPhieuId, viewingPhieuId, viewingData,
    units, fontSize, setFontSize,
    ngayDanhGia, setNgayDanhGia,
    nguoiDanhGia, setNguoiDanhGia,
    donViDuocDanhGia, setDonViDuocDanhGia,
    expandedPhan, setExpandedPhan,
    expandedChuong, setExpandedChuong,
    expandedTieuChi, setExpandedTieuChi,
    loadSheets, handleAddNew, handleEditSheet, handleViewSheet, handleSaveAssessment,
    naturalSort
  };
};
