import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { assessmentService } from '../services';
import { teamAssessment83Service } from '../services/teamAssessment83Service';
import {
  ViewMode, ActiveTab, AssessmentSheet,
  KqDanhGia83, Data83tc, DmDonVi
} from '../types';
import { supabase } from '../../../supabaseClient';

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
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
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
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showTeamSelect, setShowTeamSelect] = useState(false);

  // Form State
  const [ngayDanhGia, setNgayDanhGia] = useState(new Date().toISOString().split('T')[0]);
  const [nguoiDanhGia, setNguoiDanhGia] = useState(user?.full_name || "");
  const [donViDuocDanhGia, setDonViDuocDanhGia] = useState(uDept);

  const normalizeOwnerName = (value?: string | null) => (value || '').trim().toLowerCase();
  const canModifySheet = useCallback((sheet?: AssessmentSheet | null) => {
    if (!sheet) return false;
    if (user?.id && sheet.nguoi_tao_id === user.id) return true;

    // Backward compatibility for older sheets saved before nguoi_tao_id was populated.
    return !sheet.nguoi_tao_id &&
      normalizeOwnerName(sheet.nguoi_danh_gia) === normalizeOwnerName(user?.full_name || user?.username);
  }, [user?.full_name, user?.id, user?.username]);

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

  const filterCriteriaForCurrentAssessment = useCallback((
    allCriteria: Data83tc[],
    teamName?: string | null,
    departmentCode = uDeptCode
  ) => {
    if (activeTab === 'TEAM_ASSESSMENT') {
      if (!teamName) return [];
      return allCriteria.filter(item =>
        (item.to_cham_diem || '').split(',').map(value => value.trim()).includes(teamName)
      );
    }

    return allCriteria.filter(item =>
      (item.phu_trach || '').split(',').map(value => value.trim()).includes(departmentCode)
    );
  }, [activeTab, uDeptCode]);

  const loadSheets = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'TEAM_ASSESSMENT') {
        data = await teamAssessment83Service.fetchSheets();
        // Non-admins only see sheets for their teams
        if (!isAdmin) {
          data = data.filter(s => userTeams.includes(s.nhom || ''));
        }
      } else {
        data = await assessmentService.fetchSheets();
        // Non-admins only see sheets for their department
        if (!isAdmin) {
          data = data.filter(s => {
            const sheetDeptCode = (s.don_vi_duoc_danh_gia || "").split('-')[0].trim();
            return sheetDeptCode === uDeptCode;
          });
        }
      }
      setSheetList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdmin, uDeptCode, userTeams]);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  useEffect(() => {
    if (isAdmin) {
      assessmentService.fetchUnits().then(setUnits);
    }

    // Fetch user teams
    if (user?.id) {
      let query = supabase.from('assessment_team_members').select('team_name');

      // If not admin, only fetch teams the user is part of
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      query.then((res: { data: any[] | null }) => {
        const teams = Array.from(new Set((res.data || []).map((t: any) => t.team_name))).filter(Boolean);
        setUserTeams(teams as string[]);
      });
    }
  }, [isAdmin, user?.id]);

  const handleEditSheet = async (sheet: AssessmentSheet) => {
    if (!canModifySheet(sheet)) {
      alert("Bạn chỉ có quyền xem phiếu này. Chỉ người tạo phiếu mới được chỉnh sửa.");
      return;
    }

    setLoading(true);
    try {
      setEditingPhieuId(sheet.phieu_id);
      setDonViDuocDanhGia(sheet.don_vi_duoc_danh_gia);
      setNgayDanhGia(sheet.ngay_danh_gia);
      setNguoiDanhGia(sheet.nguoi_danh_gia);
      const sheetTeam = activeTab === 'TEAM_ASSESSMENT' ? sheet.nhom || null : null;
      setSelectedTeam(sheetTeam);

      const all = await assessmentService.fetchCriteria();
      const sheetDeptCode = (sheet.don_vi_duoc_danh_gia || '').split('-')[0].trim();
      const filtered = filterCriteriaForCurrentAssessment(all, sheetTeam, sheetDeptCode);
      let kq;
      if (activeTab === 'TEAM_ASSESSMENT') {
        kq = await teamAssessment83Service.fetchResultsByPhieuId(sheet.phieu_id);
      } else {
        kq = await assessmentService.fetchResultsByPhieuId(sheet.phieu_id);
      }
      const newResults: Record<string, Partial<KqDanhGia83>> = {};
      kq.forEach(r => {
        newResults[r.ma_tieu_muc] = {
          dat_muc: r.dat_muc,
          ghi_chu: r.ghi_chu,
          hinh_anh_minh_chung: r.hinh_anh_minh_chung || []
        };
      });
      const configuredCodes = new Set(filtered.map(item => item.ma_tieu_muc));
      const savedCriteria = kq
        .filter(result => !configuredCodes.has(result.ma_tieu_muc))
        .map(result => ({
          phan: result.phan || null,
          chuong: result.chuong || null,
          tieu_chi: result.tieu_chi || null,
          muc: result.nhom || String(result.muc_dat_duoc || 1),
          ma_tieu_muc: result.ma_tieu_muc,
          tieu_muc: result.tieu_muc || null,
          phu_trach: null,
          don_vi_phoi_hop: null,
          to_cham_diem: activeTab === 'TEAM_ASSESSMENT' ? sheetTeam : null
        } as Data83tc));
      setCriteria([...filtered, ...savedCriteria]);
      setResults(newResults);
      setViewMode('FORM');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async (teamName?: string) => {
    setEditingPhieuId(null);
    setResults({});
    setNgayDanhGia(new Date().toISOString().split('T')[0]);
    setDonViDuocDanhGia(uDept);
    setSelectedTeam(teamName || null);
    setShowTeamSelect(false);

    setLoading(true);
    try {
      const all = await assessmentService.fetchCriteria();
      const filtered = filterCriteriaForCurrentAssessment(all, teamName);
      setCriteria(filtered);
      setViewMode('FORM');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (activeTab === 'TEAM_ASSESSMENT') {
      if (userTeams.length === 1 && !isAdmin) {
        handleStartAssessment(userTeams[0]);
      } else if (userTeams.length > 0) {
        setShowTeamSelect(true);
      } else {
        alert("Bạn chưa được phân công vào tổ chấm điểm nào.");
      }
    } else {
      handleStartAssessment();
    }
  };

  const handleDeleteSheet = async (phieuId: string) => {
    const sheet = sheetList.find(item => item.phieu_id === phieuId);
    if (!canModifySheet(sheet)) {
      alert("Bạn chỉ có quyền xem phiếu này. Chỉ người tạo phiếu mới được xóa.");
      return;
    }

    if (activeTab === 'TEAM_ASSESSMENT') {
      await teamAssessment83Service.deleteSheet(phieuId);
    } else {
      await assessmentService.deleteSheet(phieuId);
    }
    loadSheets();
  };

  const handleViewSheet = async (sheet: AssessmentSheet) => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'TEAM_ASSESSMENT') {
        data = await teamAssessment83Service.fetchResultsByPhieuId(sheet.phieu_id);
      } else {
        data = await assessmentService.fetchResultsByPhieuId(sheet.phieu_id);
      }
      const allCriteria = await assessmentService.fetchCriteria();
      const relevantCriteria = filterCriteriaForCurrentAssessment(
        allCriteria,
        activeTab === 'TEAM_ASSESSMENT' ? sheet.nhom : null,
        (sheet.don_vi_duoc_danh_gia || '').split('-')[0].trim()
      );
      const resultByCode = new Map(data.map(item => [item.ma_tieu_muc, item]));
      const completeData = relevantCriteria.map(item => {
        const savedResult = resultByCode.get(item.ma_tieu_muc!);
        if (savedResult) return savedResult;
        return {
          ngay_danh_gia: sheet.ngay_danh_gia,
          nguoi_danh_gia: sheet.nguoi_danh_gia,
          don_vi_duoc_danh_gia: sheet.don_vi_duoc_danh_gia,
          phan: item.phan || "",
          chuong: item.chuong || "",
          tieu_chi: item.tieu_chi || "",
          ma_tieu_muc: item.ma_tieu_muc!,
          tieu_muc: item.tieu_muc || "",
          nhom: item.muc || "",
          dat: false,
          khong_dat: false,
          khong_danh_gia: false,
          dat_muc: ""
        } as KqDanhGia83;
      });
      const configuredCodes = new Set(relevantCriteria.map(item => item.ma_tieu_muc));
      data.forEach(item => {
        if (!configuredCodes.has(item.ma_tieu_muc)) completeData.push(item);
      });
      setViewingPhieuId(sheet.phieu_id);
      setViewingData(completeData.length > 0 ? completeData : data);
      setViewMode('DETAIL');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!donViDuocDanhGia) return alert("Vui lòng nhập đơn vị được đánh giá.");
    if (editingPhieuId) {
      const editingSheet = sheetList.find(sheet => sheet.phieu_id === editingPhieuId);
      if (!canModifySheet(editingSheet)) {
        alert("Bạn chỉ có quyền xem phiếu này. Chỉ người tạo phiếu mới được chỉnh sửa.");
        setViewMode('LIST');
        return;
      }
    }
    setSaving(true);
    try {
      const phieuId = editingPhieuId || crypto.randomUUID();
      const payload: KqDanhGia83[] = criteria
        .filter(c => {
          const result = results[c.ma_tieu_muc!];
          return Boolean(
            result?.dat_muc ||
            result?.ghi_chu?.trim() ||
            result?.hinh_anh_minh_chung?.length
          );
        })
        .map(c => {
          const res = results[c.ma_tieu_muc!];
          const itemLevelStr = c.muc || '1';
          const itemLevel = parseInt(itemLevelStr.replace('Mức ', '')) || 1;

          const resultItem: KqDanhGia83 = {
            phieu_id: phieuId,
            nguoi_tao_id: user?.id || "",
            ngay_danh_gia: ngayDanhGia,
            nguoi_danh_gia: nguoiDanhGia,
            don_vi_duoc_danh_gia: donViDuocDanhGia,
            phan: c.phan || "",
            chuong: c.chuong || "",
            tieu_chi: c.tieu_chi || "",
            ma_tieu_muc: c.ma_tieu_muc!,
            tieu_muc: c.tieu_muc || "",
            nhom: c.muc || "",
            dat_muc: res.dat_muc || "",
            dat: res.dat_muc === "Đạt",
            khong_dat: res.dat_muc === "Chưa đạt",
            khong_danh_gia: res.dat_muc === "Không đánh giá",
            ghi_chu: res.ghi_chu || "",
            hinh_anh_minh_chung: res.hinh_anh_minh_chung || [],
            muc_dat_duoc: itemLevel
          };

          if (activeTab === 'TEAM_ASSESSMENT') {
            resultItem.to_danh_gia = selectedTeam || "";
          }

          return resultItem;
        });

      if (payload.length === 0) {
        alert("Vui lòng chấm điểm hoặc nhập ghi chú trước khi lưu phiếu.");
        return;
      }

      if (editingPhieuId) {
        if (activeTab === 'TEAM_ASSESSMENT') {
          await teamAssessment83Service.deleteSheet(editingPhieuId);
        } else {
          await assessmentService.deleteSheet(editingPhieuId);
        }
      }

      if (activeTab === 'TEAM_ASSESSMENT') {
        await teamAssessment83Service.saveResultsBulk(payload);
      } else {
        await assessmentService.saveResultsBulk(payload);
      }
      alert("Đã lưu phiếu chấm điểm thành công!");
      setViewMode('LIST');
      loadSheets();
    } catch (err) {
      console.error("Lỗi khi lưu phiếu chấm điểm:", err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'message' in err
          ? String((err as { message: unknown }).message)
          : "Không xác định được nguyên nhân.";
      alert(`Lỗi khi lưu phiếu chấm điểm: ${message}`);
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
    userTeams, selectedTeam, setSelectedTeam,
    showTeamSelect, setShowTeamSelect,
    loadSheets, handleAddNew, handleEditSheet, handleViewSheet, handleSaveAssessment,
    handleStartAssessment, handleDeleteSheet
  };
};
