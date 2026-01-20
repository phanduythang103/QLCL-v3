
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
  SUPERVISION = 'SUPERVISION', // Kiểm tra giám sát
  REPORTS = 'REPORTS', // Báo cáo tổng hợp
  SETTINGS = 'SETTINGS' // Cấu hình hệ thống
}

export type QARoleType = 'COUNCIL' | 'BOARD' | 'NETWORK';

export type SupervisionCategory = 'SURGERY' | 'HAND_HYGIENE' | '5S' | 'RECORDS' | 'DRUGS' | 'PROFESSIONAL' | 'GENERAL' | null;

export interface Personnel {
  id: string;
  name: string;
  rank: string;       // Cấp bậc (VD: Đại tá, Thượng tá...)
  position: string;   // Chức vụ (VD: Giám đốc, Trưởng khoa...)
  department: string; // Khoa/Phòng công tác
  phone: string;      // Số điện thoại
  hasCertificate: boolean; // Chứng chỉ đào tạo QLCL
  qaRoles: QARoleType[]; // Thành viên: Hội đồng, Ban, hoặc Mạng lưới (Có thể nhiều vai trò)
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