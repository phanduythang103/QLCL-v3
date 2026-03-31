
export enum UserRole {
  ADMIN = 'ADMIN', // Ban Giám đốc, Ban QLCL
  STAFF = 'STAFF'  // Mạng lưới QLCL, Khoa phòng
}

export enum ModuleType {
  DASHBOARD = 'DASHBOARD',
  HR = 'HR', // Quản lý nhân sự
  DOCS = 'DOCS', // Văn bản - Thư viện
  ASSESSMENT = 'ASSESSMENT', // Đánh giá chất lượng
  INCIDENTS = 'INCIDENTS', // Sự cố y khoa
  IMPROVEMENT = 'IMPROVEMENT', // Cải tiến chất lượng
  INDICATORS = 'INDICATORS', // Chỉ số QLCL
  KTCM = 'KTCM', // KTCM theo tuyến
  PT_LOAI_2 = 'PT_LOAI_2', // Phẫu thuật loại II trở lên
  SUPERVISION = 'SUPERVISION', // Kiểm tra giám sát
  REPORTS = 'REPORTS', // Báo cáo tổng hợp
  SETTINGS = 'SETTINGS' // Cấu hình hệ thống
}

export type QARoleType = 'COUNCIL' | 'BOARD' | 'NETWORK';

export type SupervisionCategory = 'SURGERY' | 'HAND_HYGIENE' | '5S' | 'RECORDS' | 'DRUGS' | 'PROFESSIONAL' | 'GENERAL' | 'NDNB' | 'PROF_DUTY' | 'PROF_EMERGENCY' | 'PROF_ADMISSION' | null;

export type IndicatorCategory = 
  | 'VAP' 
  | 'SSI' 
  | 'SEVERE_INCIDENT' 
  | 'SEVERE_NON_MEDICAL'
  | 'AVG_EXAM_TIME'
  | 'AVG_STAY_TIME'
  | 'BED_USAGE'
  | 'OR_USAGE'
  | 'OR_DOWNTIME'
  | 'NURSE_PATIENT_RATIO'
  | 'SHIFT_MANPOWER'
  | 'HAND_HYGIENE'
  | 'KTCM'
  | 'SURGERY_II'
  | 'INDICATOR_CONFIG'
  | 'OVERVIEW'
  | null;

export interface IndicatorConfig {
  id: string;
  created_at: string;
  ten_chi_so: string;
  muc_tieu: number | null;
  don_vi_tinh: string | null;
  tu_ngay: string | null;
  den_ngay: string | null;
  linh_vuc_ap_dung: string | null;
  thong_tin: string | null;
  dinh_nghia?: string | null;
  khia_canh_cl?: string | null;
  thanh_to_cl?: string | null;
  ly_do_lua_chon?: string | null;
  cong_thuc?: string | null;
  tu_so?: string | null;
  mau_so?: string | null;
  tieu_chuan_lua_chon?: string | null;
  tieu_chuan_loai_tru?: string | null;
  nguon_so_lieu?: string | null;
  phuong_phap_thu_thap?: string | null;
  tan_suat_bao_cao?: string | null;
  trach_nhiem?: string | null;
  danh_gia?: string | null;
}

export interface Personnel {
  id: string;
  username: string;
  full_name: string;
  role: string;
  status: string;
  avatar?: string;
  name?: string;
  rank?: string;       // Cấp bậc (VD: Đại tá, Thượng tá...)
  position?: string;   // Chức vụ (VD: Giám đốc, Trưởng khoa...)
  department?: string; // Khoa/Phòng công tác
  phone?: string;      // Số điện thoại
  hasCertificate?: boolean; // Chứng chỉ đào tạo QLCL
  qaRoles?: QARoleType[]; // Thành viên: Hội đồng, Ban, hoặc Mạng lưới (Có thể nhiều vai trò)
}

export interface Document {
  id: string;
  code: string; // Số hiệu văn bản
  title: string; // Tên tài liệu
  category: 'LEGAL' | 'MOH' | 'HOSPITAL' | 'SOP' | 'INTL'; // Phân loại (2.1 - 2.5)
  docType: string; // Loại (Thông tư, Quyết định, Luật...)
  field: string; // Lĩnh vực (QLCL, KSNK, Điều dưỡng...)
  issuingAuthority: string; // Cơ quan ban hành
  effectiveDate: string; // Ngày hiệu lực
  relatedCriteria?: string; // Gắn với tiêu chí (VD: A1.1)
  link?: string; // Link tải/xem
  status: 'ACTIVE' | 'EXPIRED' | 'REPLACED'; // Trạng thái
}

export interface IncidentReport {
  id: string;
  date: string;
  location: string;
  description: string;
  severity: 'Near Miss' | 'Mild' | 'Moderate' | 'Severe' | 'Death';
  status: 'New' | 'Analyzing' | 'Closed';
}

export interface IndicatorData {
  name: string;
  target: number;
  actual: number[];
  months: string[];
}

export interface SupervisionChecklist {
  id: string;
  name: string;
  category: 'SURGERY' | 'DRUGS' | 'HAND_HYGIENE' | '5S' | 'RECORDS' | 'OTHER' | 'PROFESSIONAL';
  lastChecked: string;
  complianceRate: number;
}

export interface BcCqy {
  id?: string;
  ngay_bao_cao: string;
  noi_dung_bao_cao: string;
  noi_xay_ra: string;
  thoi_gian_xay_ra: string;
  noi_dung_ket_luan: string;
  created_at?: string;
}

export interface KtcmTheoTuyen {
  id: string;
  created_at: string;
  ngay_bao_cao: string | null;
  nguoi_bao_cao: string | null;
  chuyen_khoa_linh_vuc: string | null;
  tong_so_ky_thuat: number | null;
  so_ky_thuat_da_thuc_hien: number | null;
  so_ky_thuat_chua_thuc_hien: number | null;
  ty_le: number | null;
  nguyen_nhan_chua_trien_khai: string | null;
  ghi_chu: string | null;
}

export interface PtLoai2 {
  id: string;
  created_at: string;
  updated_at: string;
  ngay_bao_cao: string | null;
  nguoi_bao_cao: string | null;
  khoa: string | null;
  tong_so_pt: number | null;
  pt_loai_db: number | null;
  pt_loai_1: number | null;
  pt_loai_2: number | null;
  tong_pt_loai_2_tro_len: number | null;
  ty_le: number | null;
  ghi_chu: string | null;
}

export interface BcNhanLucCa {
  id?: string;
  created_at?: string;
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  khoa_bao_cao: string;
  sang_dd: number;
  sang_nb: number;
  sang_ty_le: number;
  sang_an_toan: string;
  chieu_dd: number;
  chieu_nb: number;
  chieu_ty_le: number;
  chieu_an_toan: string;
  dem_dd: number;
  dem_nb: number;
  dem_ty_le: number;
  dem_an_toan: string;
}

export interface GsVst {
  id?: string;
  created_at?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  khoa_duoc_giam_sat: string;
  doi_tuong: string;
  nguoi_duoc_giam_sat: string;
  checklist_data: {
    moments: {
      id: number;
      name: string;
      compliance: boolean;
      correct_technique: boolean;
      note: string;
    }[];
  };
  tong_co_hoi: number;
  so_lan_tuan_thu: number;
  so_lan_dung_ky_thuat: number;
  hinh_anh_minh_chung: string[];
  ghi_chu_chung: string;
}

export interface SurgerySafety {
  id?: string;
  created_at?: string;
  updated_at?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  ban_mo_so: string;
  khoa_phau_thuat: string;
  ho_ten_nguoi_benh: string;
  kip_phau_thuat: string;
  tc1_xac_nhan_danh_tinh: boolean;
  tc2_xac_nhan_vi_tri: boolean;
  tc3_cam_ket_phau_thuat: boolean;
  tc4_kiem_tra_thiet_bi: boolean;
  tc5_danh_gia_nguy_co: boolean;
  tc6_gioi_thieu_nhan_su: boolean;
  tc7_xac_nhan_lan_cuoi: boolean;
  tc8_du_phong_nhiem_khuan: boolean;
  tc9_cac_van_de_phat_sinh: boolean;
  tc10_kiem_dem_dung_cu: boolean;
  tc11_mau_benh_pham: boolean;
  tc12_ghi_chep_ho_so: boolean;
  tc13_ban_giao_hoi_tinh: boolean;
  tong_dat: number;
  ty_le_tuan_thu: number;
}

export interface DrugMonitoring {
  id?: string;
  created_at?: string;
  updated_at?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  don_vi_duoc_giam_sat: string;
  ho_ten_nb: string;
  nam_sinh?: number;
  ma_nb?: string;
  
  tc1_phi_cong_khai_dau_giuong: boolean;
  tc2_mau_phieu_dung_quy_dinh: boolean;
  tc3_khop_y_lenh_benh_an: boolean;
  tc4_ghi_cong_khai_hang_ngay: boolean;
  tc5_vat_tu_tieu_hao: boolean;
  tc6_giai_thich_tien_su_di_ung: boolean;
  tc7_ky_xac_nhan_hang_ngay: boolean;
  tc8_phong_van_nb_loai_thuoc: boolean;
  tc9_nb_xac_nhan_so_thuoc: boolean;
  tc10_nb_khong_tu_mua_thuoc: boolean;
  
  tc1_ghi_chu?: string;
  tc2_ghi_chu?: string;
  tc3_ghi_chu?: string;
  tc4_ghi_chu?: string;
  tc5_ghi_chu?: string;
  tc6_ghi_chu?: string;
  tc7_ghi_chu?: string;
  tc8_ghi_chu?: string;
  tc9_ghi_chu?: string;
  tc10_ghi_chu?: string;
  
  ghi_chu?: string;
  tong_dat: number;
  ty_le_tuan_thu: number;
  hinh_anh?: string[];
  [key: string]: any;
}

export interface AiConfig {
  id: string;
  created_at: string;
  provider: string;
  model_name: string;
  api_key: string;
  is_active: boolean;
  description?: string;
}

export interface PromptConfig {
  id: string;
  created_at: string;
  module_key: string;
  prompt_name: string;
  prompt_text: string;
  is_active: boolean;
}