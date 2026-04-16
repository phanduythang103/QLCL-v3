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
    setLoading(true);
    try {
      setEditingPhieuId(sheet.phieu_id);
      setDonViDuocDanhGia(sheet.don_vi_duoc_danh_gia);
      setNgayDanhGia(sheet.ngay_danh_gia);
      setNguoiDanhGia(sheet.nguoi_danh_gia);
      setSelectedTeam(sheet.nhom || null); // Team name is stored in nhom for sheets

      const all = await assessmentService.fetchCriteria();
      const filtered = isAdmin ? all : all.filter(c => {
        const itemPhuTrach = (c.phu_trach || '').split(',').map(s => s.trim()).filter(Boolean);
        const itemTeams = (c.to_cham_diem || '').split(',').map(s => s.trim()).filter(Boolean);

        // Match by Dept
        const matchDept = itemPhuTrach.includes(uDeptCode);

        // Match by ANY of user's teams
        const matchAnyTeam = itemTeams.some(t => userTeams.includes(t));

        return matchDept || matchAnyTeam;
      });
      setCriteria(filtered);

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
      const filtered = isAdmin ? all : all.filter(c => {
        const itemPhuTrach = (c.phu_trach || '').split(',').map(s => s.trim()).filter(Boolean);
        const itemTeams = (c.to_cham_diem || '').split(',').map(s => s.trim()).filter(Boolean);

        const matchDept = itemPhuTrach.includes(uDeptCode);
        const matchAnyTeam = itemTeams.some(t => userTeams.includes(t));

        return matchDept || matchAnyTeam;
      });
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
        handleStartAssessment();
      }
    } else {
      // Standard assessment tab logic
      if (userTeams.length === 1 && !isAdmin) {
        handleStartAssessment(userTeams[0]);
      } else if (userTeams.length > 0) {
        setShowTeamSelect(true);
      } else {
        handleStartAssessment();
      }
    }
  };

  const handleDeleteSheet = async (phieuId: string) => {
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
        // If viewing a team assessment, aggregate results for this team + unit + day
        // Following the "lowest score wins" rule
        data = await teamAssessment83Service.aggregateResultsByTeam(
          sheet.nhom || "",
          sheet.don_vi_duoc_danh_gia,
          sheet.ngay_danh_gia
        );
      } else {
        data = await assessmentService.fetchResultsByPhieuId(sheet.phieu_id);
      }
      setViewingPhieuId(sheet.phieu_id);
      setViewingData(data);
      setViewMode('DETAIL');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            to_danh_gia: selectedTeam || "",
            muc_dat_duoc: itemLevel
          };
        });

      if (editingPhieuId) {
        if (selectedTeam) {
          await teamAssessment83Service.deleteSheet(editingPhieuId);
        } else {
          await assessmentService.deleteSheet(editingPhieuId);
        }
      }

      if (selectedTeam) {
        await teamAssessment83Service.saveResultsBulk(payload);
      } else {
        await assessmentService.saveResultsBulk(payload);
      }
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
    userTeams, selectedTeam, setSelectedTeam,
    showTeamSelect, setShowTeamSelect,
    loadSheets, handleAddNew, handleEditSheet, handleViewSheet, handleSaveAssessment,
    handleStartAssessment, handleDeleteSheet
  };
};
