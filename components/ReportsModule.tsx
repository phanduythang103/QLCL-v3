import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, RefreshCw, FileSpreadsheet, Search, Database,
  Briefcase, Activity, AlertCircle, Users, HeartPulse,
  HandMetal, ShieldCheck, Pill, LayoutList, Stethoscope, DoorOpen, ClipboardCheck,
  Baby, Info, X
} from 'lucide-react';
import { fetchLichSuBaoCao, addLichSuBaoCao, LichSuBaoCao } from '../readLichSuBaoCao';
import { useAuth } from '../contexts/AuthContext';
import DateRangeFilter, { DateFilterState } from './DateRangeFilter';
import * as XLSX from 'xlsx';

// Import All Data Services
import { inpatientSatisfactionService } from './Assessment/services/inpatientSatisfactionService';
import { outpatientSatisfactionService } from './Assessment/services/outpatientSatisfactionService';
import { staffSatisfactionService } from './Assessment/services/staffSatisfactionService';
import { ksNuoiConService } from './Assessment/services/ksNuoiConService';
import { ksMeSinhConService } from './Assessment/services/ksMeSinhConService';
import { fetchChiSoQlcl } from '../readChiSoQlcl';
import { fetchBaoCaoScyk } from '../readBaoCaoScyk';
import { fetchBcScnyknt } from '../readBcScnyknt';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';

// Supervision GS Services
import { fetchGsVst } from '../readGsVst';
import { fetchSurgerySafety } from '../readSurgerySafety';
import { fetchGsDrug } from '../readGsDrug';
import { fetchGs5s } from '../readGs5s';
import { fetchGiamSatNdnb } from '../readGiamSatNdnb';
import { fetchGiamSatHsba } from '../readGiamSatHsba';
import { fetchGsCdTruc } from '../readGsCdTruc';
import { fetchGsCapCuu } from '../readGsCapCuu';
import { fetchGsRaVaoVien } from '../readGsRaVaoVien';
import { fetchGsChung } from '../readGsChung';

// Assessment Services
import { fetchAssessmentSheets, fetchKqDanhGia83 } from '../readKqDanhGia83';
import { fetchData83tc } from '../readData83tc';
import { tieuChiCoBanService } from './Assessment/services/tieuChiCoBanService';

type ReportCategory =
  | 'SATISFACTION_INPATIENT' | 'SATISFACTION_OUTPATIENT' | 'SATISFACTION_STAFF'
  | 'SURVEY_BREASTFEEDING' | 'SURVEY_CHILDBIRTH'
  | 'INDICATORS' | 'INCIDENTS_MEDICAL' | 'INCIDENTS_NON_MEDICAL' | 'STAFF_LIST'
  | 'GS_HAND_HYGIENE' | 'GS_SURGERY' | 'GS_DRUG' | 'GS_5S'
  | 'GS_NDNB' | 'GS_HSBA' | 'GS_DUTY' | 'GS_EMERGENCY' | 'GS_ADMISSION' | 'GS_GENERAL'
  | 'ASSESSMENT_SHEETS' | 'ASSESSMENT_DETAIL' | 'ASSESSMENT_CRITERIA';

interface CategoryConfig {
  id: ReportCategory;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  fetchFn: () => Promise<any[]>;
  dateField: string;
  fixedColumns?: { key: string; label: string; render?: (row: any) => string }[];
}

// Vietnamese field labels
const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  created_at: 'Ngày tạo',
  ngay_khao_sat: 'Ngày khảo sát',
  survey_date: 'Ngày khảo sát',
  ngay_giam_sat: 'Ngày giám sát',
  ngay_kiem_tra: 'Ngày kiểm tra',
  ngay_bao_cao: 'Ngày báo cáo',
  thang_nam: 'Tháng/Năm',
  khoa: 'Khoa',
  khoa_phong: 'Khoa/Phòng',
  phong_kham: 'Phòng khám',
  khoa_gs: 'Khoa GS',
  don_vi: 'Đơn vị',
  don_vi_duoc_giam_sat: 'Đơn vị được GS',
  don_vi_duoc_kiem_tra: 'Đơn vị được KT',
  khoa_duoc_giam_sat: 'Khoa được GS',
  khoa_phau_thuat: 'Khoa phẫu thuật',
  ho_ten_nguoi_benh: 'Tên người bệnh',
  ho_ten_nb: 'Tên người bệnh',
  ho_ten_nhan_vien: 'Tên nhân viên',
  ho_ten: 'Họ tên',
  nguoi_bao_cao: 'Người báo cáo',
  nguoi_giam_sat: 'Người GS',
  nguoi_gs: 'Người GS',
  nguoi_kiem_tra: 'Người KT',
  nguoi_duoc_giam_sat: 'Người được GS',
  doi_tuong_giam_sat: 'Đối tượng GS',
  doi_tuong: 'Đối tượng',
  chuc_vu: 'Chức vụ',
  trang_thai: 'Trạng thái',
  patient_id: 'Mã NB',
  mother_id: 'Mã mẹ',
  ma_hsba: 'Mã HSBA',
  ma_nb: 'Mã NB',
  ban_mo_so: 'Bàn mổ số',
  kip_phau_thuat: 'Kíp phẫu thuật',
  phone: 'Số điện thoại',
  age: 'Tuổi',
  department: 'Khoa',
  departments: 'Các khoa',
  ty_le_hai_long: '% Hài lòng',
  satisfaction_percent: '% Hài lòng',
  overall_satisfaction: 'Mức hài lòng',
  ty_le_tuan_thu: '% Tuân thủ',
  ty_le: '% Đạt',
  tong_dat: 'Tổng đạt',
  tong_tieu_chi: 'Tổng tiêu chí',
  tong_diem: 'Tổng điểm',
  tong_co_hoi: 'Tổng cơ hội',
  so_lan_tuan_thu: 'Số lần tuân thủ',
  so_lan_dung_ky_thuat: 'Dùng đúng kỹ thuật',
  ten_chi_so: 'Tên chỉ số',
  gia_tri: 'Giá trị',
  muc_tieu: 'Mục tiêu',
  mo_ta_su_co: 'Mô tả sự cố',
  muc_do_anh_huong: 'Mức độ ảnh hưởng',
  noi_xay_ra: 'Nơi xảy ra',
  thoi_gian_xay_ra: 'Thời gian xảy ra',
  mo_ta_dien_bien: 'Diễn biến',
  hau_qua: 'Hậu quả',
  bien_phap_xu_ly: 'Biện pháp xử lý',
  nguyen_nhan_so_bo: 'Nguyên nhân sơ bộ',
  ghi_chu: 'Ghi chú',
  ghi_chu_chung: 'Ghi chú chung',
  delivery_type: 'Hình thức sinh',
  birth_method: 'Cách sinh',
  days_in_hospital: 'Số ngày nằm viện',
  hospital_days: 'Số ngày nằm viện',
  visit_count: 'Số lần nhập viện',

  // ── Phiếu Hài lòng Nội trú ──
  full_name: 'Họ tên người trả lời',
  respondent: 'Đối tượng trả lời',
  return_intent: 'Quay lại / Giới thiệu',
  feedback: 'Ý kiến góp ý',
  q1: 'NT-A1: Thời gian chờ thang máy',
  q2: 'NT-A2: Hỗ trợ di chuyển',
  q3: 'NT-B3: Thủ tục ra viện',
  q4: 'NT-B4: Bác sĩ giải thích bệnh',
  q5: 'NT-C5: Wifi/Internet',
  q6: 'NT-C6: Vệ sinh buồng bệnh',
  q7: 'NT-C7: Sự riêng tư',
  q8: 'NT-C8: Tình trạng giường bệnh',
  q9: 'NT-D9: NV không dùng điện thoại',
  q10: 'NT-D10: Thái độ bảo vệ/hành chính',
  q11: 'NT-E11: Cung ứng thuốc/vật tư',
  q12: 'NT-E12: Chất lượng bữa ăn',
  q13: 'NTr-D13: NV không dùng điện thoại',
  q14: 'NTr-E14: Tin tưởng chẩn đoán',
  q15: 'NTr-E15: Minh bạch chi phí',

  // ── Phiếu Hài lòng Ngoại trú ──
  area: 'Khu vực khám',
  visit_time: 'Thời gian đến khám',
  waiting_issues: 'Vấn đề chờ đợi',
  priority_improvement: 'Ưu tiên cải thiện',
  priority_improvement_other: 'Ưu tiên cải thiện (khác)',

  // ── Phiếu Hài lòng Nhân viên ──
  block: 'Khối công tác',
  position: 'Vị trí/Chức danh',
  years: 'Năm công tác',
  pressure: 'Nguồn áp lực',
  pressure_other: 'Nguồn áp lực (khác)',
  financial_suggestion: 'Đề xuất thu nhập',
  stay_intent: 'Dự định gắn bó',
  suggestion: 'Kiến nghị',

  // ── Khảo sát Nuôi con bằng sữa mẹ ──
  hospital: 'Bệnh viện',
  department_code: 'Mã khoa',
  birth_count: 'Số lần sinh',
  baby_birth_date: 'Ngày sinh trẻ',
  cord_cut: 'Cắt dây rốn',
  skin_to_skin: 'Da kề da',
  first_breastfeed: 'Thời điểm bú lần đầu',
  other_food: 'Cho ăn thêm',
  suggest_formula: 'Gợi ý sữa công thức',
  benefits: 'Lợi ích sữa mẹ',
  exclusive_months: 'Bú mẹ hoàn toàn (tháng)',
  total_months: 'Tổng thời gian dự định bú (tháng)',
  suggestions: 'Kiến nghị',
  see_policy: 'Thấy quy định NCBSM',
  see_media: 'Thấy tài liệu truyền thông',
  consultation_time: 'Được tư vấn khi nào',
  reason_no_consult: 'Lý do không được tư vấn',
  support_person: 'Người hỗ trợ bú',
  support_type: 'Hình thức hỗ trợ',

  // ── Khảo sát Mẹ sinh con ──
  bhyt: 'Sử dụng BHYT',
  prenatal_check: 'Khám thai trước sinh',
  prenatal_check_other: 'Khám thai (ghi rõ)',
  birth_method_other: 'Cách sinh (ghi rõ)',
  return_intent_other: 'Quay lại (ghi rõ)',
  note: 'Ý kiến thêm',
  ea1: 'A1. Thủ tục nhập viện thuận tiện',
  ea2: 'A2. Phân luồng, chỉ dẫn rõ ràng',
  eb1: 'B1. Quy trình khám nhanh chóng',
  eb2: 'B2. Hướng dẫn theo dõi thai',
  ec1: 'C1. Tư vấn trước sinh đầy đủ',
  ec2: 'C2. Tư vấn khi chuyển dạ',
  ec3: 'C3. Tư vấn chăm sóc sau sinh',
  ed1: 'D1. Buồng bệnh sạch, thoáng',
  ed2: 'D2. Nhà vệ sinh sạch sẽ',
  ed3: 'D3. Giường bệnh đảm bảo',
  ed4: 'D4. Sự riêng tư được đảm bảo',
  ed5: 'D5. Wifi/Internet',
  ed6: 'D6. Chế độ ăn phù hợp',
  ee1: 'E1. Bác sĩ tận tâm, lắng nghe',
  ee2: 'E2. Điều dưỡng/Hộ sinh thân thiện',
  ee3: 'E3. NV không dùng điện thoại',
  ee4: 'E4. Thái độ hành chính, bảo vệ',
  eg1: 'G1. Kết quả chuyên môn tốt',
  eg2: 'G2. An toàn mẹ và bé',
  eg3: 'G3. Chi phí minh bạch',
  eh1: 'H1. Tổng hài lòng dịch vụ',
  eh2: 'H2. Sẵn sàng quay lại',
  eh3: 'H3. Sẵn sàng giới thiệu',

  // ── Đánh giá chất lượng (83 tiêu chí) ──
  phieu_id: 'Mã phiếu',
  nguoi_tao_id: 'Người tạo',
  ngay_danh_gia: 'Ngày đánh giá',
  nguoi_danh_gia: 'Người đánh giá',
  don_vi_duoc_danh_gia: 'Đơn vị được đánh giá',
  phan: 'Phần',
  chuong: 'Chương',
  tieu_chi: 'Tiêu chí',
  ma_tieu_muc: 'Mã tiểu mục',
  tieu_muc: 'Tiểu mục',
  nhom: 'Nhóm',
  to_danh_gia: 'Tổ đánh giá',
  dat: 'Đạt',
  khong_dat: 'Không đạt',
  khong_danh_gia: 'Không đánh giá',
  dat_muc: 'Đạt mức',
  muc_dat_duoc: 'Mức đạt được (1-5)',
  total_criteria: 'Tổng tiêu chí',
  passed_criteria: 'Số tiêu chí đạt',
  score: 'Điểm (1-5)',
  // Bo 83 tieu chi
  ma_tieu_chi: 'Mã tiêu chí',
  ten_nhom: 'Tên nhóm',
  ten_tieu_chi: 'Tên tiêu chí',
  don_vi_phu_trach: 'Đơn vị phụ trách',
  diem_tu_cham: 'Điểm tự chấm',
  diem_doan_cham: 'Điểm đoàn chấm',
  so_minh_chung: 'Số minh chứng',
  nam_danh_gia: 'Năm đánh giá',
};

// Format any date-like value to dd/mm/yyyy (Vietnam)
const formatDate = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') {
    // ISO date string: 2025-04-16 or 2025-04-16T...
    const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    // Already dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}/.test(val)) return val.slice(0, 10);
    // MM/YYYY (period format for indicators)
    if (/^\d{1,2}\/\d{4}$/.test(val)) return val;
  }
  return String(val);
};

// Is this key a date field?
const DATE_KEYS = new Set(['ngay_khao_sat', 'survey_date', 'ngay_giam_sat', 'ngay_kiem_tra', 'ngay_bao_cao', 'thang_nam', 'created_at', 'updated_at', 'ngay_tao', 'baby_birth_date']);

// Flatten a row to a flat record (skip complex nested objects/arrays)
const flattenRow = (obj: any): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    // Skip internal / blob fields
    if (key === 'checklist_data' || key === 'noi_dung_gs' || key === 'hinh_anh_minh_chung' || key === 'hinh_anh') continue;
    if (Array.isArray(val)) {
      // For array fields like see_policy, store as joined
      out[key] = val.join(', ');
      continue;
    }
    if (val !== null && typeof val === 'object') continue;
    out[key] = val;
  }
  return out;
};

// Format a value for display in the table
const formatCellValue = (key: string, val: any): string => {
  if (val === null || val === undefined || val === '') return '---';
  if (DATE_KEYS.has(key)) return formatDate(val);
  if (typeof val === 'boolean') return val ? 'Đạt' : 'Không đạt';
  if (typeof val === 'number') {
    // Percentage fields between 0–1 or 0–100
    if ((key.includes('ty_le') || key.includes('satisfaction_percent')) && val <= 1) {
      return `${(val * 100).toFixed(1)}%`;
    }
    if ((key.includes('ty_le') || key.includes('satisfaction_percent')) && val > 1) {
      return `${val.toFixed(1)}%`;
    }
    return String(val);
  }
  return String(val);
};

export const ReportsModule: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin')
  );
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: 'all', startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState<LichSuBaoCao[]>([]);
  const [viewedRecord, setViewedRecord] = useState<any | null>(null);

  const categoryConfigs: CategoryConfig[] = [
    { id: 'SATISFACTION_INPATIENT', name: 'Hài lòng Nội trú', icon: <Users />, color: '#2563eb', bgColor: '#eff6ff', fetchFn: () => inpatientSatisfactionService.fetchInpatientSurveys(), dateField: 'ngay_khao_sat' },
    { id: 'SATISFACTION_OUTPATIENT', name: 'Hài lòng Ngoại trú', icon: <HeartPulse />, color: '#16a34a', bgColor: '#f0fdf4', fetchFn: () => outpatientSatisfactionService.fetchOutpatientSurveys(), dateField: 'ngay_khao_sat' },
    { id: 'SATISFACTION_STAFF', name: 'Hài lòng Nhân viên', icon: <Briefcase />, color: '#7c3aed', bgColor: '#f5f3ff', fetchFn: () => staffSatisfactionService.fetchSurveys(), dateField: 'ngay_khao_sat' },
    { id: 'SURVEY_BREASTFEEDING', name: 'KS Nuôi con sữa mẹ', icon: <Baby />, color: '#0d9488', bgColor: '#f0fdfa', fetchFn: () => ksNuoiConService.fetchAll(), dateField: 'survey_date' },
    { id: 'SURVEY_CHILDBIRTH', name: 'KS Mẹ sinh con', icon: <Users />, color: '#db2777', bgColor: '#fdf2f8', fetchFn: () => ksMeSinhConService.fetchAll(), dateField: 'survey_date' },
    { id: 'INDICATORS', name: 'Chỉ số QLCL', icon: <Activity />, color: '#d97706', bgColor: '#fffbeb', fetchFn: () => fetchChiSoQlcl(), dateField: 'thang_nam' },
    { id: 'INCIDENTS_MEDICAL', name: 'Sự cố Y khoa', icon: <AlertCircle />, color: '#dc2626', bgColor: '#fef2f2', fetchFn: () => fetchBaoCaoScyk(), dateField: 'ngay_bao_cao' },
    { id: 'INCIDENTS_NON_MEDICAL', name: 'Sự cố Ngoài Y khoa', icon: <Info />, color: '#475569', bgColor: '#f8fafc', fetchFn: () => fetchBcScnyknt(), dateField: 'ngay_bao_cao' },
    { id: 'STAFF_LIST', name: 'Nhân sự QLCL', icon: <Users />, color: '#6366f1', bgColor: '#eef2ff', fetchFn: () => fetchNhanSuQlcl(), dateField: 'created_at' },
    { id: 'GS_HAND_HYGIENE', name: 'GS Vệ sinh tay', icon: <HandMetal />, color: '#0d9488', bgColor: '#f0fdfa', fetchFn: () => fetchGsVst(), dateField: 'ngay_giam_sat' },
    { id: 'GS_SURGERY', name: 'GS An toàn PT', icon: <ShieldCheck />, color: '#ea580c', bgColor: '#fff7ed', fetchFn: () => fetchSurgerySafety(), dateField: 'ngay_giam_sat' },
    { id: 'GS_DRUG', name: 'GS Công khai thuốc', icon: <Pill />, color: '#2563eb', bgColor: '#eff6ff', fetchFn: () => fetchGsDrug(), dateField: 'ngay_giam_sat' },
    { id: 'GS_5S', name: 'Giám sát 5S', icon: <LayoutList />, color: '#16a34a', bgColor: '#f0fdf4', fetchFn: () => fetchGs5s(), dateField: 'ngay_giam_sat' },
    { id: 'GS_NDNB', name: 'GS Nhận diện NB', icon: <Users />, color: '#7c3aed', bgColor: '#f5f3ff', fetchFn: () => fetchGiamSatNdnb(), dateField: 'ngay_giam_sat' },
    { id: 'GS_HSBA', name: 'GS Hồ sơ bệnh án', icon: <FileText />, color: '#4f46e5', bgColor: '#eef2ff', fetchFn: () => fetchGiamSatHsba(), dateField: 'ngay_giam_sat' },
    { id: 'GS_DUTY', name: 'GS Trực CM', icon: <Stethoscope />, color: '#e11d48', bgColor: '#fff1f2', fetchFn: () => fetchGsCdTruc(), dateField: 'ngay_kiem_tra' },
    { id: 'GS_EMERGENCY', name: 'GS Cấp cứu', icon: <Activity />, color: '#0891b2', bgColor: '#ecfeff', fetchFn: () => fetchGsCapCuu(), dateField: 'ngay_kiem_tra' },
    { id: 'GS_ADMISSION', name: 'GS Vào/Ra viện', icon: <DoorOpen />, color: '#44403c', bgColor: '#f5f5f4', fetchFn: () => fetchGsRaVaoVien(), dateField: 'ngay_giam_sat' },
    {
      id: 'GS_GENERAL', name: 'GS Chung', icon: <ClipboardCheck />, color: '#10b981', bgColor: '#ecfdf5',
      fetchFn: () => fetchGsChung(), dateField: 'ngay_giam_sat',
      fixedColumns: [
        { key: 'ngay_giam_sat', label: 'Ngày giám sát', render: (row) => formatDate(row.ngay_giam_sat) },
        {
          key: '_nguoi_khoa',
          label: 'Người GS / Khoa',
          render: (row) => [row.nguoi_gs, row.khoa_gs, row.doi_tuong_gs].filter(Boolean).join(' — '),
        },
        {
          key: '_ket_qua_chung',
          label: 'Kết quả',
          render: (row) => {
            const dat = row.tong_dat ?? 0;
            const muc = row.tong_muc ?? 0;
            const tl = row.ty_le != null ? row.ty_le : (muc > 0 ? ((dat / muc) * 100).toFixed(1) : 0);
            return `Đạt ${dat}/${muc} mục — ${tl}%${row.ket_luan ? ' — ' + row.ket_luan : ''}`;
          },
        },
        {
          key: '_noi_dung',
          label: 'Nội dung giám sát',
          render: (row) => {
            const items: any[] = Array.isArray(row.noi_dung_gs) ? row.noi_dung_gs : [];
            if (!items.length) return '---';
            return items.map((it: any) =>
              `${it.label || ''}: ${it.is_pass ? '✅' : '❌'}${it.note ? ' (' + it.note + ')' : ''}`
            ).join(' | ');
          },
        },
      ],
    },
  ];

  const currentConfig = useMemo(() => categoryConfigs.find(c => c.id === selectedCategory), [selectedCategory]);

  // Derive display columns from the actual data (from first row)
  // Per-category question labels that differ from the global dictionary
  const STAFF_Q_LABELS: Record<string, string> = {
    q1: 'A1. Thu nhập tương xứng công việc',
    q2: 'A2. Minh bạch thu nhập tăng thêm',
    q3: 'A3. Phụ cấp trực, thưởng',
    q4: 'A4. Chăm sóc đời sống NVYT',
    q5: 'B5. Nhân lực đủ đáp ứng công việc',
    q6: 'B6. Tần suất trực hợp lý',
    q7: 'B7. Phân công công việc công bằng',
    q8: 'C8. Hệ thống CNTT (phần mềm, máy tính)',
    q9: 'C9. Trang thiết bị chuyên môn',
    q10: 'C10. Hậu cần (ăn, nghỉ)',
    q11: 'D11. Ban Giám đốc lắng nghe ý kiến',
    q12: 'D12. Cơ hội đào tạo nghiệp vụ',
    q13: 'D13. Sự đoàn kết nội bộ',
  };

  const OUTPATIENT_Q_LABELS: Record<string, string> = {
    q1: 'A1. Sự thuận tiện khu vực gửi xe',
    q2: 'A2. Phân luồng Quân - Dân rõ ràng',
    q3: 'A3. Biển báo và hướng dẫn tại sảnh',
    q4: 'B4. Thời gian đăng ký và thanh toán',
    q5: 'B5. Chờ siêu âm, chiếu chụp',
    q6: 'B6. Thời gian trả kết quả xét nghiệm',
    q7: 'C7. Ghế ngồi chờ',
    q8: 'C8. Nhà vệ sinh',
    q9: 'C9. Wifi',
    q10: 'D10. Thái độ nhân viên hành chính',
    q11: 'D11. Bác sĩ tư vấn, lắng nghe',
    q12: 'D12. Thực hiện kỹ thuật của học viên',
    q13: 'D13. Không dùng điện thoại khi làm việc',
    q14: 'E14. Tin tưởng kết quả chẩn đoán',
    q15: 'E15. Minh bạch chi phí',
  };

  const GS_ADMISSION_LABELS: Record<string, string> = {
    doi_tuong_gs: 'Đối tượng GS',
    c1: 'I.C1. Thủ tục hành chính nhập viện',
    c1_ghi_chu: 'I.C1. Ghi chú',
    c2: 'I.C2. Giải thích quy định buồng bệnh',
    c2_ghi_chu: 'I.C2. Ghi chú',
    c3: 'I.C3. Đội ngũ điều dưỡng tiếp đón',
    c3_ghi_chu: 'I.C3. Ghi chú',
    c4: 'II.C4. Hội chẩn chuyển khoa kịp thời',
    c4_ghi_chu: 'II.C4. Ghi chú',
    c5: 'II.C5. Bàn giao người bệnh đầy đủ',
    c5_ghi_chu: 'II.C5. Ghi chú',
    c6: 'II.C6. Hồ sơ chuyển khoa đúng quy định',
    c6_ghi_chu: 'II.C6. Ghi chú',
    c7: 'III.C7. Chỉ định chuyển viện đúng',
    c7_ghi_chu: 'III.C7. Ghi chú',
    c8: 'III.C8. Giải thích lý do chuyển viện',
    c8_ghi_chu: 'III.C8. Ghi chú',
    c9: 'III.C9. Hồ sơ chuyển viện đầy đủ',
    c9_ghi_chu: 'III.C9. Ghi chú',
    c10: 'IV.C10. Tóm tắt bệnh án ra viện',
    c10_ghi_chu: 'IV.C10. Ghi chú',
    c11: 'IV.C11. Hướng dẫn dặn dò ra viện',
    c11_ghi_chu: 'IV.C11. Ghi chú',
    c12: 'IV.C12. Thủ tục hành chính ra viện',
    c12_ghi_chu: 'IV.C12. Ghi chú',
    c13: 'V.C13. An toàn người bệnh',
    c13_ghi_chu: 'V.C13. Ghi chú',
    c14: 'V.C14. Phòng ngừa té ngã/loét',
    c14_ghi_chu: 'V.C14. Ghi chú',
    ket_luan_chung: 'Kết luận chung',
  };

  const displayColumns = useMemo(() => {
    // For categories with fixedColumns, return them only when data is loaded (or loading)
    // This prevents empty column headers appearing before any data attempt
    if (currentConfig?.fixedColumns && (data.length > 0 || loading)) return currentConfig.fixedColumns;
    // For dynamic columns, derive from first row
    if (!data.length) return [];
    const firstRow = flattenRow(data[0]);
    const qLabels =
      selectedCategory === 'SATISFACTION_STAFF' ? STAFF_Q_LABELS :
        selectedCategory === 'SATISFACTION_OUTPATIENT' ? OUTPATIENT_Q_LABELS :
          selectedCategory === 'GS_ADMISSION' ? GS_ADMISSION_LABELS : {};
    return Object.keys(firstRow).filter(k => k !== 'id').map(k => ({
      key: k,
      label: qLabels[k] || FIELD_LABELS[k] || k,
      render: undefined as ((row: any) => string) | undefined,
    }));
  }, [data, selectedCategory, currentConfig, loading]);



  const loadReportData = async () => {
    if (!selectedCategory || !currentConfig) return;
    setLoading(true);
    setError(null);
    try {
      const result = await currentConfig.fetchFn();
      setData(result || []);
    } catch (err) {
      setError('Lỗi tải dữ liệu báo cáo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedCategory]);

  const filteredData = useMemo(() => {
    if (!data.length || !currentConfig) return [];
    let result = [...data];

    if (dateFilter.type !== 'all') {
      const now = new Date();
      // Vietnam offset: UTC+7
      const toVN = (d: Date) => new Date(d.getTime() + 7 * 60 * 60 * 1000);
      let start: Date, end: Date;

      if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
        start = new Date(dateFilter.startDate + 'T00:00:00+07:00');
        end = new Date(dateFilter.endDate + 'T23:59:59+07:00');
      } else {
        const vnNow = toVN(now);
        const y = vnNow.getUTCFullYear(), m = vnNow.getUTCMonth(), d = vnNow.getUTCDate();
        const dow = vnNow.getUTCDay() === 0 ? 7 : vnNow.getUTCDay(); // Mon=1..Sun=7

        if (dateFilter.type === 'thisWeek') {
          start = new Date(Date.UTC(y, m, d - dow + 1) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y, m, d - dow + 7, 23, 59, 59) - 7 * 3600 * 1000);
        } else if (dateFilter.type === 'lastWeek') {
          start = new Date(Date.UTC(y, m, d - dow - 6) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y, m, d - dow, 23, 59, 59) - 7 * 3600 * 1000);
        } else if (dateFilter.type === 'thisMonth') {
          start = new Date(Date.UTC(y, m, 1) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59) - 7 * 3600 * 1000);
        } else if (dateFilter.type === 'lastMonth') {
          start = new Date(Date.UTC(y, m - 1, 1) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y, m, 0, 23, 59, 59) - 7 * 3600 * 1000);
        } else if (dateFilter.type === 'thisQuarter') {
          const q = Math.floor(m / 3);
          start = new Date(Date.UTC(y, q * 3, 1) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y, q * 3 + 3, 0, 23, 59, 59) - 7 * 3600 * 1000);
        } else if (dateFilter.type === 'lastQuarter') {
          const q = Math.floor(m / 3);
          start = new Date(Date.UTC(y, (q - 1) * 3, 1) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y, q * 3, 0, 23, 59, 59) - 7 * 3600 * 1000);
        } else if (dateFilter.type === 'thisYear') {
          start = new Date(Date.UTC(y, 0, 1) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y, 11, 31, 23, 59, 59) - 7 * 3600 * 1000);
        } else if (dateFilter.type === 'lastYear') {
          start = new Date(Date.UTC(y - 1, 0, 1) - 7 * 3600 * 1000);
          end = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59) - 7 * 3600 * 1000);
        } else {
          start = new Date(0); end = new Date();
        }
      }

      result = result.filter(item => {
        const dateVal = item[currentConfig.dateField];
        if (!dateVal) return false;
        // Handle MM/YYYY indicator format
        if (typeof dateVal === 'string' && /^\d{1,2}\/\d{4}$/.test(dateVal)) {
          const [mon, yr] = dateVal.split('/').map(Number);
          const d = new Date(Date.UTC(yr, mon - 1, 1) - 7 * 3600 * 1000);
          return d >= start && d <= end;
        }
        const d = new Date(dateVal);
        return d >= start && d <= end;
      });
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    return result;
  }, [data, dateFilter, searchTerm, currentConfig]);

  const handleExportExcel = () => {
    if (!filteredData.length || !currentConfig) return;
    try {
      const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
      const fileName = `BAO_CAO_${currentConfig.id}_${timestamp}.xlsx`;
      const exportData = filteredData.map(item => {
        const flat = flattenRow(item);
        const row: any = {};
        for (const [k, v] of Object.entries(flat)) {
          const label = FIELD_LABELS[k] || k;
          row[label] = DATE_KEYS.has(k) ? formatDate(v) : v;
        }
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu');
      XLSX.writeFile(wb, fileName);
      saveToHistory();
    } catch (err) {
      console.error('Export error:', err);
      alert('Lỗi xuất file Excel.');
    }
  };

  const saveToHistory = async () => {
    if (!currentConfig) return;
    // Vietnam datetime: dd/MM/yyyy HH:mm
    const now = new Date();
    const vnOffset = 7 * 60 * 60 * 1000;
    const vnNow = new Date(now.getTime() + vnOffset);
    const pad = (n: number) => String(n).padStart(2, '0');
    const ngayXuat = `${pad(vnNow.getUTCDate())}/${pad(vnNow.getUTCMonth() + 1)}/${vnNow.getUTCFullYear()} ${pad(vnNow.getUTCHours())}:${pad(vnNow.getUTCMinutes())}`;
    const nguoiXuat = user ? `${user.full_name} (${user.username})` : 'Khách';
    const filterLabel = dateFilter.type === 'all' ? 'Tất cả thời gian' :
      dateFilter.type === 'custom' ? `${dateFilter.startDate} → ${dateFilter.endDate}` :
        dateFilter.type.replace('this', 'Kỳ này ').replace('last', 'Kỳ trước ');
    try {
      await addLichSuBaoCao({
        ten_bao_cao: `${currentConfig.name} (${filteredData.length} bản ghi)`,
        loai_bao_cao: currentConfig.name,
        ky_bao_cao: filterLabel,
        nguoi_tao: nguoiXuat,
        ngay_tao: ngayXuat,
        ghi_chu: `Xuất lúc ${ngayXuat}`,
      });
      loadHistory();
    } catch (e) { console.error(e); }
  };

  const loadHistory = async () => {
    try { setReports(await fetchLichSuBaoCao()); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="space-y-6 pb-20">

      {/* ── Category Selection ── */}
      <div className="bg-white rounded-[2.5rem] md:rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-50 p-6 md:p-8">
        <h3 className="text-section font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
          <Database size={20} className="text-[#009900]" /> Nội dung báo cáo
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-10 gap-3">
          {categoryConfigs.map((cat) => (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSearchTerm(''); }}
              className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${selectedCategory === cat.id ? 'bg-slate-50 ring-2 ring-[#009900]/20 scale-105 shadow-inner' : 'hover:bg-slate-50'}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: cat.bgColor, color: cat.color }}>
                {React.cloneElement(cat.icon as any, { size: 22 })}
              </div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Data Table ── */}
      {selectedCategory && (
        <div className="bg-white rounded-[2.5rem] md:rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-50 p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: currentConfig?.bgColor, color: currentConfig?.color }}>
                {React.cloneElement(currentConfig!.icon as any, { size: 20 })}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase leading-none">{currentConfig?.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {loading ? 'Đang tải...' : `${filteredData.length} bản ghi`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
              <div className="relative flex-1 md:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Tìm kiếm nhanh..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                />
              </div>
              {isAdmin && (
              <button
                onClick={handleExportExcel}
                disabled={filteredData.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-[#009900] text-white rounded-lg hover:bg-[#0d6e39] font-black text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet size={16} /> Xuất Excel
              </button>
              )}
            </div>
          </div>

          {/* Table */}
          {error ? (
            <div className="p-10 text-center bg-red-50 rounded-2xl border border-red-100">
              <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
              <p className="text-sm font-bold text-red-600">{error}</p>
              <button onClick={loadReportData} className="mt-4 text-[10px] font-black uppercase text-red-700 underline tracking-widest">Thử lại</button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {displayColumns.map(col => (
                      <th key={col.key} className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={displayColumns.length || 4} className="px-4 py-10 text-center text-slate-400 italic">Đang tải dữ liệu...</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan={displayColumns.length || 4} className="px-4 py-10 text-center text-slate-400 italic">Không có dữ liệu</td></tr>
                  ) : (
                    filteredData.slice(0, 20).map((row, idx) => {
                      const flat = flattenRow(row);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          {displayColumns.map(col => (
                            <td key={col.key} className="px-3 py-2.5 text-slate-700 font-medium whitespace-nowrap">
                              {col.render ? col.render(row) : formatCellValue(col.key, flat[col.key])}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {filteredData.length > 20 && (
            <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase italic">
              {isAdmin
                ? `Hiển thị 20/${filteredData.length} bản ghi — Xuất Excel để lấy toàn bộ dữ liệu`
                : `Hiển thị 20/${filteredData.length} bản ghi`}
            </p>
          )}
        </div>
      )}

      {/* ── History ── */}
      <div className="bg-white rounded-[2.5rem] md:rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-50 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
            <FileText size={18} className="text-[#009900]" /> Lịch sử xuất báo cáo
          </h3>
          <button onClick={loadHistory} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#009900] hover:bg-green-50 transition-all" title="Làm mới">
            <RefreshCw size={18} />
          </button>
        </div>
        {reports.length === 0 ? (
          <div className="text-center py-12 text-slate-300">
            <FileText size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-xs font-black uppercase tracking-widest">Chưa có lịch sử báo cáo nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#009900] text-white">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Ngày xuất BC</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Người xuất BC</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Nội dung BC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.slice(0, 10).map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-[#009900] opacity-60 group-hover:opacity-100" />
                        {report.ngay_tao || '---'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{report.nguoi_tao || '---'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">
                        {report.loai_bao_cao || report.ten_bao_cao}
                      </span>
                      {report.ky_bao_cao && (
                        <span className="ml-2 text-[10px] text-slate-400 font-bold">{report.ky_bao_cao}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
