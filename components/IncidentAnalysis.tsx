import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, Download, Edit2, Eye, FileText, Loader2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { fetchBaoCaoScyk } from '../readBaoCaoScyk';
import type { BaoCaoScyk } from '../readBaoCaoScyk';
import { fetchDmDonVi, type DmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { incidentMatchesUserDepartment } from '../utils/incidentLinks';
import {
  addRcaAnalysis, deleteRcaAnalysis, fetchRcaAnalyses, fetchRcaPrefillSuggestion,
  fetchRcaTimeline, fetchRcaWithTimeline, replaceRcaTimeline, updateRcaAnalysis,
  type RcaAnalysisRecord, type RcaAnalysisWithTimeline, type RcaTimelineRow,
} from '../readRcaPhanTichScyk';

const statuses = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'IN_REVIEW', label: 'Đang rà soát' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'CLOSED', label: 'Đã đóng' },
] as const;

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100';
const textareaClass = `${inputClass} min-h-[92px] resize-y leading-relaxed`;

const emptyTimeline = (thuTu: number): RcaTimelineRow => ({ thu_tu: thuTu, thoi_diem: '', vi_tri: '', lam_sang: '', can_lam_sang_xu_tri: '', la_thoi_diem_su_co: false });
const today = () => new Date().toISOString().slice(0, 10);
const statusLabel = (value?: string) => statuses.find(s => s.value === value)?.label || 'Bản nháp';
const fmt = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '';
const toDateTimeLocal = (value?: string) => {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return raw.slice(0, 16);
  const localMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (localMatch) {
    const [, year, month, day, hour, minute] = localMatch;
    return `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}`;
  }
  const viMatch = raw.match(/^(\d{1,2})[:hH](\d{2})(?:,|\s+ngày)?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (viMatch) {
    const [, hour, minute, day, month, year] = viMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};
const formatVietnamDateTime = (value?: string) => {
  if (!value) return '';
  const raw = String(value).trim();
  const localMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (localMatch) {
    const [, year, month, day, hour, minute] = localMatch;
    return `${hour.padStart(2, '0')}:${minute}, ${day}/${month}/${year}`;
  }
  const viMatch = raw.match(/^(\d{1,2})[:hH](\d{2})(?:,|\s+ngày)?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (viMatch) {
    const [, hour, minute, day, month, year] = viMatch;
    return `${hour.padStart(2, '0')}:${minute}, ${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  const timeIsoDateMatch = raw.match(/^(\d{1,2})[:hH](\d{2})(?:,|\s+ngày)?\s*(\d{4})-(\d{2})-(\d{2})/);
  if (timeIsoDateMatch) {
    const [, hour, minute, year, month, day] = timeIsoDateMatch;
    return `${hour.padStart(2, '0')}:${minute}, ${day}/${month}/${year}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.hour}:${parts.minute}, ${parts.day}/${parts.month}/${parts.year}`;
};
const incidentDateTimeLocal = (source?: Pick<BaoCaoScyk, 'ngay_xay_ra_sc' | 'thoi_gian'> | Record<string, any>) => {
  const rawDate = String(source?.ngay_xay_ra_sc || source?.ngay_xay_ra || source?.ngay || '').trim();
  const rawTime = String(source?.thoi_gian || source?.gio_xay_ra || source?.gio || '').trim();
  if (!rawDate || !rawTime) return '';
  const dateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/) || rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const timeMatch = rawTime.match(/(\d{1,2})\s*[:hH]\s*(\d{2})/);
  if (!dateMatch || !timeMatch) return '';
  const datePart = dateMatch[3]?.length === 4
    ? `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`
    : `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  const hour = timeMatch[1].padStart(2, '0');
  const minute = timeMatch[2].padStart(2, '0');
  return `${datePart}T${hour}:${minute}`;
};

const incidentPatientLabel = (incident?: BaoCaoScyk, suggestion?: RcaAnalysisRecord) => {
  const patientCode = incident?.ma_bn?.trim() || String(suggestion?.ma_nguoi_benh || '').split(' - ')[0].trim();
  return patientCode;
};
const ageFromDob = (value?: string) => {
  if (!value) return null;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

const initialForm: RcaAnalysisRecord = {
  scyk_id: '', trang_thai: 'DRAFT', ngay_phan_tich: today(), nguoi_phan_tich: '', nhom_phan_tich: [],
  ma_scyk: '', so_benh_an: '', ma_nguoi_benh: '', gioi: '', tuoi: null, thoi_gian_vao_vien: '',
  khoa_xay_ra_su_co: '', vao_khoa_luc: '', khoa_tiep_nhan_sau: '', khoa_tiep_nhan_luc: '', thoi_diem_su_co: '', tinh_bao_cao: '',
  tien_su_benh_su: '', chan_doan_ban_dau: '', dien_bien_su_co: '', xu_tri_su_co: '', dien_tien_sau_su_co: '',
  loai_su_co: '', phan_loai_nhom_su_co: [], phan_loai_nhom_su_co_khac: '', muc_do_ton_hai: '', phan_loai_nguy_co: '', kha_nang_phong_ngua: '',
  phan_loai_nhom_nguyen_nhan: [], phan_loai_nhom_nguyen_nhan_khac: '',
  phan_tich_chan_doan_tiep_nhan: '', phan_tich_theo_doi_truoc_su_co: '', phan_tich_cap_cuu_khi_su_co: '', phan_tich_hoi_suc_sau_su_co: '', ket_luan_phu_hop_xu_tri: '', mo_ta_hanh_dong_xu_ly_su_co: '',
  yeu_to_nguoi_benh: '', yeu_to_nhan_vien: '', yeu_to_moi_truong_thiet_bi: '', yeu_to_quy_trinh_nhiem_vu: '', yeu_to_to_chuc_quan_ly: '', nguyen_nhan_goc_re: '', van_de_phat_hien_them: '',
  bai_hoc_kinh_nghiem: [], khuyen_nghi_he_thong: '', khuyen_nghi_cong_cu_quy_trinh: '', khuyen_nghi_phan_mem_cntt: '', khuyen_nghi_kiem_tra_giam_sat: '', xem_xet_trach_nhiem_hanh_chinh_hs: '', xem_xet_trach_nhiem_chuyen_mon_theo_doi: '',
  mo_ta_ket_qua_phat_hien: '', da_thao_luan_khuyen_cao: '', phu_hop_khuyen_cao_chinh_thuc: '', khuyen_cao_ap_dung: '',
  muc_do_ton_thuong_nguoi_benh: '', ton_thuong_to_chuc: [], ton_thuong_to_chuc_khac: '',
};

const headerFields: Array<[keyof RcaAnalysisRecord, string, string?]> = [
  ['ma_scyk', 'Mã sự cố'], ['ma_nguoi_benh', 'Người bệnh / mã NB'], ['so_benh_an', 'Số bệnh án'], ['gioi', 'Giới'], ['tuoi', 'Tuổi', 'number'], ['thoi_gian_vao_vien', 'Vào viện'],
  ['khoa_xay_ra_su_co', 'Khoa xảy ra sự cố'], ['vao_khoa_luc', 'Vào khoa lúc'], ['khoa_tiep_nhan_sau', 'Khoa tiếp nhận sau'], ['khoa_tiep_nhan_luc', 'Khoa tiếp nhận lúc'], ['thoi_diem_su_co', 'Thời điểm sự cố'], ['tinh_bao_cao', 'Tính báo cáo'],
];
const descriptionFields: Array<[keyof RcaAnalysisRecord, string]> = [['tien_su_benh_su', '1. Tiền sử / bệnh sử'], ['chan_doan_ban_dau', '2. Chẩn đoán ban đầu'], ['dien_bien_su_co', '3. Diễn biến sự cố'], ['xu_tri_su_co', '4. Xử trí sự cố'], ['dien_tien_sau_su_co', '5. Diễn tiến sau sự cố']];
const classificationFields: Array<[keyof RcaAnalysisRecord, string]> = [['muc_do_ton_hai', 'Mức độ tổn hại'], ['phan_loai_nguy_co', 'Phân loại nguy cơ'], ['kha_nang_phong_ngua', 'Khả năng phòng ngừa']];
type IncidentGroupCategory = { group: string; items: string[] };
const incidentGroupCategories: IncidentGroupCategory[] = [
  { group: '1. Thực hiện quy trình kỹ thuật, thủ thuật chuyên môn', items: [
    'Không có sự đồng ý của người bệnh/người nhà (đối với kỹ thuật, thủ thuật phải ký cam kết)',
    'Không thực hiện khi có chỉ định',
    'Thực hiện sai người bệnh',
    'Thực hiện sai thủ thuật/quy trình/phương pháp điều trị',
    'Thực hiện sai vị trí phẫu thuật/thủ thuật',
    'Bỏ sót dụng cụ, vật tư tiêu hao trong quá trình phẫu thuật',
    'Tử vong trong thai kỳ',
    'Tử vong khi sinh',
    'Tử vong sơ sinh',
  ] },
  { group: '2. Nhiễm khuẩn bệnh viện', items: [
    'Nhiễm khuẩn huyết',
    'Viêm phổi',
    'Nhiễm khuẩn vết mổ',
    'Nhiễm khuẩn tiết niệu',
    'Các loại nhiễm khuẩn khác',
  ] },
  { group: '3. Thuốc và dịch truyền', items: [
    'Cấp phát sai thuốc/dịch truyền',
    'Thiếu thuốc',
    'Sai thuốc',
    'Sai liều',
    'Sai hàm lượng',
    'Sai thời gian',
    'Sai y lệnh',
    'Sai người bệnh',
    'Sai đường dùng',
    'Bỏ sót thuốc/liều thuốc',
  ] },
  { group: '4. Máu và các chế phẩm máu', items: [
    'Phản ứng phụ, tai biến khi truyền máu',
    'Truyền nhầm máu hoặc chế phẩm máu',
    'Truyền sai liều',
    'Truyền sai thời điểm',
  ] },
  { group: '5. Thiết bị y tế', items: [
    'Thiếu thông tin hướng dẫn sử dụng',
    'Lỗi thiết bị',
    'Thiết bị thiếu',
    'Thiết bị không phù hợp',
  ] },
  { group: '6. Hành vi', items: [
    'Khuynh hướng tự gây hại',
    'Có hành động tự tử',
    'Quấy rối tình dục bởi nhân viên',
    'Quấy rối tình dục bởi người bệnh/khách đến thăm',
    'Xâm hại cơ thể bởi người bệnh/khách đến thăm',
    'Trốn viện',
  ] },
  { group: '7. Tai nạn đối với người bệnh', items: ['Té ngã'] },
  { group: '8. Hạ tầng cơ sở', items: [
    'Bị hư hỏng',
    'Bị lỗi',
    'Thiếu',
    'Không phù hợp',
  ] },
  { group: '9. Quản lý nguồn lực, tổ chức', items: [
    'Dịch vụ khám chữa bệnh không phù hợp',
    'Dịch vụ khám chữa bệnh không đầy đủ',
    'Nguồn lực không phù hợp',
    'Nguồn lực không đầy đủ',
    'Chính sách không phù hợp',
    'Quy định không phù hợp',
    'Quy trình không phù hợp',
    'Hướng dẫn chuyên môn không phù hợp',
  ] },
  { group: '10. Hồ sơ, tài liệu, thủ tục hành chính', items: [
    'Tài liệu mất hoặc thiếu',
    'Tài liệu không rõ ràng',
    'Tài liệu không hoàn chỉnh',
    'Cung cấp hồ sơ chậm',
    'Nhầm hồ sơ tài liệu',
    'Thời gian chờ đợi kéo dài',
    'Thủ tục hành chính phức tạp',
  ] },
  { group: '11. Khác', items: ['Các sự cố không thuộc các nhóm trên'] },
];
const groupItemKey = (group: string, item: string) => `${group}||${item}`;
const incidentCauseCategories: IncidentGroupCategory[] = [
  { group: '1. Nhân viên', items: [
    'Nhận thức (kiến thức, hiểu biết, quan niệm)',
    'Thực hành (kỹ năng thực hành không đúng quy định/hướng dẫn chuẩn hoặc thực hành theo quy định, hướng dẫn sai)',
    'Thái độ, hành vi, cảm xúc',
    'Giao tiếp',
    'Tâm sinh lý, thể chất, bệnh lý',
    'Các yếu tố xã hội',
  ] },
  { group: '2. Người bệnh', items: [
    'Nhận thức (kiến thức, hiểu biết, quan niệm)',
    'Thực hành (kỹ năng thực hành không đúng quy định/hướng dẫn chuẩn hoặc thực hành theo quy định, hướng dẫn sai)',
    'Thái độ, hành vi, cảm xúc',
    'Giao tiếp',
    'Tâm sinh lý, thể chất, bệnh lý',
    'Các yếu tố xã hội',
  ] },
  { group: '3. Môi trường làm việc', items: [
    'Cơ sở vật chất, hạ tầng, trang thiết bị',
    'Khoảng cách đến nơi làm việc quá xa',
    'Đánh giá về độ an toàn, các nguy cơ rủi ro của môi trường làm việc',
    'Nội quy, quy định và đặc tính kỹ thuật',
  ] },
  { group: '4. Tổ chức/Dịch vụ', items: [
    'Các chính sách, quy trình, hướng dẫn chuyên môn',
    'Không tuân thủ quy trình thực hành chuẩn',
    'Văn hóa tổ chức',
    'Làm việc nhóm',
  ] },
  { group: '5. Yếu tố bên ngoài', items: [
    'Môi trường tự nhiên',
    'Sản phẩm, công nghệ và cơ sở hạ tầng',
    'Quy trình, hệ thống dịch vụ',
  ] },
  { group: '6. Khác', items: ['Các yếu tố không thuộc các nhóm trên'] },
];
const clinicalFields: Array<[keyof RcaAnalysisRecord, string]> = [['phan_tich_chan_doan_tiep_nhan', '1. Giai đoạn chẩn đoán và tiếp nhận'], ['phan_tich_theo_doi_truoc_su_co', '2. Theo dõi trước sự cố'], ['phan_tich_cap_cuu_khi_su_co', '3. Cấp cứu khi xảy ra sự cố'], ['phan_tich_hoi_suc_sau_su_co', '4. Hồi sức sau sự cố'], ['ket_luan_phu_hop_xu_tri', '5. Kết luận tính phù hợp của xử trí'], ['mo_ta_hanh_dong_xu_ly_su_co', '6. Mô tả hành động xử lý sự cố']];
const causeFields: Array<[keyof RcaAnalysisRecord, string]> = [['yeu_to_nguoi_benh', 'Người bệnh'], ['yeu_to_nhan_vien', 'Nhân viên'], ['yeu_to_moi_truong_thiet_bi', 'Môi trường / thiết bị'], ['yeu_to_quy_trinh_nhiem_vu', 'Quy trình / nhiệm vụ'], ['yeu_to_to_chuc_quan_ly', 'Tổ chức / quản lý'], ['nguyen_nhan_goc_re', 'Nguyên nhân gốc rễ xác định'], ['van_de_phat_hien_them', 'Vấn đề phát hiện thêm']];
const recommendationFields: Array<[keyof RcaAnalysisRecord, string]> = [['khuyen_nghi_he_thong', '1. Giải pháp hệ thống'], ['xem_xet_trach_nhiem_hanh_chinh_hs', '2. Xem xét trách nhiệm cá nhân']];
const yesNoUnknownOptions = ['Có', 'Không', 'Không ghi nhận'];
const harmLevelOptions = [
  'A - Chưa xảy ra (NC0)',
  'B - Tổn thương nhẹ (NC1)',
  'C - Tổn thương nhẹ (NC1)',
  'D - Tổn thương nhẹ (NC1)',
  'E - Tổn thương trung bình (NC2)',
  'F - Tổn thương trung bình (NC2)',
  'G - Tổn thương nặng (NC3)',
  'H - Tổn thương nặng (NC3)',
  'I - Tử vong/Đặc biệt nghiêm trọng (NC3)',
];
const orgHarmOptions = [
  'Tổn hại tài sản',
  'Tăng nguồn lực phục vụ người bệnh',
  'Quan tâm của truyền thông',
  'Khiếu nại của người bệnh',
  'Tổn hại danh tiếng',
  'Can thiệp của pháp luật',
  'Khác',
];
const harmLevelNoteLines = [
  'NC1 - Tổn thương nhẹ là tổn thương tự hồi phục hoặc không cần can thiệp điều trị.',
  'NC2 - Tổn thương trung bình là tổn thương đòi hỏi can thiệp điều trị, kéo dài thời gian nằm viện, ảnh hưởng đến chức năng lâu dài.',
  'NC3 - Tổn thương nặng là tổn thương đòi hỏi phải cấp cứu hoặc can thiệp điều trị lớn, gây mất chức năng vĩnh viễn hoặc gây tử vong.',
];

type SectionProps = { title: string; children: React.ReactNode };
const Section = ({ title, children }: SectionProps) => <section className="border-t border-slate-200 pt-5"><h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-800">{title}</h3>{children}</section>;
const PartHeading = ({ title }: { title: string }) => <h2 className="border-b-2 border-slate-900 pb-2 text-base font-black uppercase tracking-wide text-slate-900">{title}</h2>;

const defaultLabelClass = 'text-[11px] font-bold uppercase tracking-wide text-slate-500';
const numberedLabelClass = 'text-sm font-bold text-slate-900';
type FieldProps = { label: string; value: any; onChange: (value: any) => void; type?: string; labelClassName?: string };
const Field = ({ label, value, onChange, type = 'text', labelClassName = defaultLabelClass }: FieldProps) => <label className="block space-y-1.5"><span className={labelClassName}>{label}</span><input type={type} value={value ?? ''} onChange={e => onChange(type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)} className={inputClass} /></label>;
const TextArea = ({ label, value, onChange, labelClassName = defaultLabelClass }: FieldProps) => <label className="block space-y-1.5"><span className={labelClassName}>{label}</span><textarea rows={4} value={value ?? ''} onChange={e => onChange(e.target.value)} className={textareaClass} /></label>;
type RadioGroupProps = { name: string; options: string[]; value: string; onChange: (value: string) => void; layout?: 'row' | 'col' | 'grid2' };
const radioLayoutClass = { row: 'flex flex-wrap gap-x-6 gap-y-2', col: 'flex flex-col gap-2', grid2: 'grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2' };
const RadioGroup = ({ name, options, value, onChange, layout = 'row' }: RadioGroupProps) => (
  <div className={radioLayoutClass[layout]}>
    {options.map(option => (
      <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
        <input type="radio" name={name} checked={value === option} onChange={() => onChange(option)} />
        <span>{option}</span>
      </label>
    ))}
  </div>
);

export const IncidentAnalysis: React.FC = () => {
  const { user } = useAuth();
  const actor = user?.full_name || user?.username || '';
  const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
  const userDepartment = user?.department?.trim().toLowerCase() || '';

  const [items, setItems] = useState<RcaAnalysisRecord[]>([]);
  const [incidents, setIncidents] = useState<BaoCaoScyk[]>([]);
  const [units, setUnits] = useState<DmDonVi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'VIEW'>('LIST');
  const [editingItem, setEditingItem] = useState<RcaAnalysisRecord | null>(null);
  const [viewingItem, setViewingItem] = useState<RcaAnalysisWithTimeline | null>(null);
  const [formData, setFormData] = useState<RcaAnalysisRecord>({ ...initialForm, nguoi_phan_tich: actor });
  const [timelineRows, setTimelineRows] = useState<RcaTimelineRow[]>([emptyTimeline(1), emptyTimeline(2), emptyTimeline(3), emptyTimeline(4)]);
  const [lessonsText, setLessonsText] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rcaData, incidentData, unitData] = await Promise.all([fetchRcaAnalyses(), fetchBaoCaoScyk(), fetchDmDonVi()]);
      setItems(rcaData || []);
      setIncidents(incidentData || []);
      setUnits(unitData || []);
    } catch (err: any) {
      setError(`Không tải được dữ liệu RCA: ${err.message}. Cần chạy supabase-sql/rca.sql trước nếu chưa tạo bảng.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const accessibleIncidents = useMemo(() => incidents.filter(incident => isAdmin || incidentMatchesUserDepartment(incident, userDepartment)), [incidents, isAdmin, userDepartment]);
  const analyzedIncidentIds = useMemo(() => new Set(items.map(item => item.scyk_id).filter(Boolean)), [items]);
  const selectableIncidents = useMemo(() => accessibleIncidents.filter(incident => editingItem?.scyk_id === incident.id || !analyzedIncidentIds.has(incident.id)), [accessibleIncidents, analyzedIncidentIds, editingItem?.scyk_id]);
  const filteredItems = useMemo(() => items.filter(item => {
    const incident = incidents.find(inc => inc.id === item.scyk_id);
    if (incident && !isAdmin && !incidentMatchesUserDepartment(incident, userDepartment)) return false;
    return [item.ma_scyk, item.ma_nguoi_benh, item.so_benh_an, item.khoa_xay_ra_su_co, item.nguyen_nhan_goc_re, incident?.so_bc_ma_scyk].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
  }), [items, incidents, isAdmin, userDepartment, searchTerm]);

  const updateField = <K extends keyof RcaAnalysisRecord>(field: K, value: RcaAnalysisRecord[K]) => setFormData(prev => ({ ...prev, [field]: value }));
  const renderFields = (fields: Array<[keyof RcaAnalysisRecord, string, string?]>) => fields.map(([key, label, type]) => <Field key={String(key)} label={label} type={type} value={formData[key] as any} onChange={value => updateField(key, value as any)} />);
  const renderTextAreas = (fields: Array<[keyof RcaAnalysisRecord, string]>, labelClassName?: string) => fields.map(([key, label]) => <TextArea key={String(key)} label={label} value={formData[key] as any} onChange={value => updateField(key, value as any)} labelClassName={labelClassName} />);
  const toggleIncidentGroupItem = (item: string) => setFormData(prev => {
    const current = prev.phan_loai_nhom_su_co || [];
    const next = current.includes(item) ? current.filter(x => x !== item) : [...current, item];
    return { ...prev, phan_loai_nhom_su_co: next };
  });
  const IncidentGroupChecklist = () => {
    const checked = formData.phan_loai_nhom_su_co || [];
    return (
      <div className="space-y-4">
        {incidentGroupCategories.map(cat => (
          <div key={cat.group}>
            <p className="mb-1.5 text-sm font-bold text-slate-900">{cat.group}</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-3">
              {cat.items.map(item => (
                <label key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="mt-0.5" checked={checked.includes(item)} onChange={() => toggleIncidentGroupItem(item)} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="shrink-0 font-bold">Khác:</span>
          <input value={formData.phan_loai_nhom_su_co_khac || ''} onChange={e => updateField('phan_loai_nhom_su_co_khac', e.target.value)} placeholder="Ghi rõ nếu có" className={inputClass} />
        </label>
      </div>
    );
  };
  const toggleIncidentCauseItem = (group: string, item: string) => setFormData(prev => {
    const key = groupItemKey(group, item);
    const current = prev.phan_loai_nhom_nguyen_nhan || [];
    const next = current.includes(key) ? current.filter(x => x !== key) : [...current, key];
    return { ...prev, phan_loai_nhom_nguyen_nhan: next };
  });
  const IncidentCauseChecklist = () => {
    const checked = formData.phan_loai_nhom_nguyen_nhan || [];
    return (
      <div className="space-y-4">
        {incidentCauseCategories.map(cat => (
          <div key={cat.group}>
            <p className="mb-1.5 text-sm font-bold text-slate-900">{cat.group}</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-3">
              {cat.items.map(item => (
                <label key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="mt-0.5" checked={checked.includes(groupItemKey(cat.group, item))} onChange={() => toggleIncidentCauseItem(cat.group, item)} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="shrink-0 font-bold">Khác:</span>
          <input value={formData.phan_loai_nhom_nguyen_nhan_khac || ''} onChange={e => updateField('phan_loai_nhom_nguyen_nhan_khac', e.target.value)} placeholder="Ghi rõ nếu có" className={inputClass} />
        </label>
      </div>
    );
  };
  const toggleOrgHarmItem = (item: string) => setFormData(prev => {
    const current = prev.ton_thuong_to_chuc || [];
    const next = current.includes(item) ? current.filter(x => x !== item) : [...current, item];
    return { ...prev, ton_thuong_to_chuc: next };
  });
  const OrgHarmChecklist = () => {
    const checked = formData.ton_thuong_to_chuc || [];
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
          {orgHarmOptions.map(item => (
            <label key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5" checked={checked.includes(item)} onChange={() => toggleOrgHarmItem(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
        {checked.includes('Khác') && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span className="shrink-0 font-bold">Nếu chọn Khác:</span>
            <input value={formData.ton_thuong_to_chuc_khac || ''} onChange={e => updateField('ton_thuong_to_chuc_khac', e.target.value)} placeholder="Ghi rõ" className={inputClass} />
          </label>
        )}
      </div>
    );
  };
  const DateTimeField = ({ label, field, readOnly = false }: { label: string; field: keyof RcaAnalysisRecord; readOnly?: boolean }) => (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="datetime-local"
        value={(formData[field] as string) || ''}
        onChange={e => updateField(field, e.target.value as any)}
        readOnly={readOnly}
        className={`${inputClass} ${readOnly ? 'bg-slate-50 text-slate-500' : ''}`}
      />
    </label>
  );
  const HeaderInfoFields = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Field label="Mã sự cố" value={formData.ma_scyk} onChange={value => updateField('ma_scyk', value)} />
      <Field label="Người bệnh / mã NB" value={formData.ma_nguoi_benh} onChange={value => updateField('ma_nguoi_benh', value)} />
      <Field label="Số bệnh án" value={formData.so_benh_an} onChange={value => updateField('so_benh_an', value)} />
      <Field label="Giới" value={formData.gioi} onChange={value => updateField('gioi', value)} />
      <Field label="Tuổi" type="number" value={formData.tuoi} onChange={value => updateField('tuoi', value)} />
      <DateTimeField label="Vào viện" field="thoi_gian_vao_vien" readOnly />
      <Field label="Khoa xảy ra sự cố" value={formData.khoa_xay_ra_su_co} onChange={value => updateField('khoa_xay_ra_su_co', value)} />
      <DateTimeField label="Vào khoa lúc" field="vao_khoa_luc" />
      <label className="block space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Khoa tiếp nhận sau</span>
        <select value={formData.khoa_tiep_nhan_sau || ''} onChange={e => updateField('khoa_tiep_nhan_sau', e.target.value)} className={inputClass}>
          <option value="">Chọn khoa tiếp nhận...</option>
          {units.map(unit => <option key={unit.id} value={`${unit.ma_don_vi} - ${unit.ten_don_vi}`}>{unit.ma_don_vi} - {unit.ten_don_vi}</option>)}
        </select>
      </label>
      <DateTimeField label="Khoa tiếp nhận lúc" field="khoa_tiep_nhan_luc" />
      <DateTimeField label="Thời điểm xảy ra sự cố" field="thoi_diem_su_co" />
    </div>
  );

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ ...initialForm, ngay_phan_tich: today(), nguoi_phan_tich: actor, created_by: actor, updated_by: actor });
    setTimelineRows([emptyTimeline(1), emptyTimeline(2), emptyTimeline(3), emptyTimeline(4)]);
    setLessonsText('');
    setViewMode('FORM');
  };

  const handleIncidentSelect = async (scykId: string) => {
    const incident = incidents.find(item => item.id === scykId);
    updateField('scyk_id', scykId);
    if (!scykId) return;
    setPrefilling(true);
    try {
      const suggestion = await fetchRcaPrefillSuggestion(scykId);
      const thoiDiem = incidentDateTimeLocal(incident) || incidentDateTimeLocal((suggestion?.nguon_bao_cao as Record<string, any>) || {});
      setFormData(prev => ({
        ...prev, scyk_id: scykId, bien_ban_xac_minh_id: suggestion?.bien_ban_xac_minh_id ?? null,
        ma_scyk: suggestion?.ma_scyk || incident?.so_bc_ma_scyk || '', so_benh_an: suggestion?.so_benh_an || incident?.so_benh_an || '',
        ma_nguoi_benh: incidentPatientLabel(incident, suggestion) || '', gioi: suggestion?.gioi || incident?.gioi || '', tuoi: suggestion?.tuoi ?? ageFromDob(incident?.ngay_sinh),
        thoi_gian_vao_vien: toDateTimeLocal(incident?.thoi_gian_vao_vien) || toDateTimeLocal(suggestion?.thoi_gian_vao_vien),
        khoa_xay_ra_su_co: suggestion?.khoa_xay_ra_su_co || incident?.khoa_phong || incident?.don_vi_bao_cao || '', thoi_diem_su_co: thoiDiem,
        tinh_bao_cao: suggestion?.tinh_bao_cao || incident?.hinh_thuc_bao_cao || '', loai_su_co: suggestion?.loai_su_co || incident?.phan_loai_sc || incident?.doi_tuong_xay_ra_sc || '',
        muc_do_ton_hai: suggestion?.muc_do_ton_hai || incident?.phan_loai_ban_dau || incident?.muc_do_anh_huong || '', dien_bien_su_co: suggestion?.dien_bien_su_co || incident?.mo_ta_su_co || '',
        xu_tri_su_co: suggestion?.xu_tri_su_co || incident?.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '', dien_tien_sau_su_co: suggestion?.dien_tien_sau_su_co || '',
        khuyen_nghi_he_thong: suggestion?.khuyen_nghi_he_thong || incident?.de_xuat_giai_phap_ban_dau || '', nguon_bao_cao: suggestion?.nguon_bao_cao || {}, nguon_bien_ban_xac_minh: suggestion?.nguon_bien_ban_xac_minh || {},
      }));
      setTimelineRows([{ ...emptyTimeline(1), thoi_diem: thoiDiem, vi_tri: suggestion?.khoa_xay_ra_su_co || incident?.khoa_phong || incident?.noi_xay_ra_sc || '', lam_sang: suggestion?.dien_bien_su_co || incident?.mo_ta_su_co || '', can_lam_sang_xu_tri: suggestion?.xu_tri_su_co || incident?.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '', la_thoi_diem_su_co: true }, emptyTimeline(2), emptyTimeline(3), emptyTimeline(4)]);
    } catch (err: any) {
      alert(`Không tự điền được từ báo cáo/biên bản xác minh: ${err.message}`);
    } finally {
      setPrefilling(false);
    }
  };

  const editItem = async (item: RcaAnalysisRecord) => {
    setLoading(true);
    try {
      const timeline = item.id ? await fetchRcaTimeline(item.id) : [];
      setEditingItem(item);
      setFormData({ ...initialForm, ...item, thoi_gian_vao_vien: toDateTimeLocal(item.thoi_gian_vao_vien), vao_khoa_luc: toDateTimeLocal(item.vao_khoa_luc), khoa_tiep_nhan_luc: toDateTimeLocal(item.khoa_tiep_nhan_luc), thoi_diem_su_co: toDateTimeLocal(item.thoi_diem_su_co) || item.thoi_diem_su_co || '', updated_by: actor || item.updated_by || '' });
      setTimelineRows(timeline.length ? timeline : [emptyTimeline(1), emptyTimeline(2), emptyTimeline(3), emptyTimeline(4)]);
      setLessonsText((item.bai_hoc_kinh_nghiem || []).join('\n'));
      setViewMode('FORM');
    } catch (err: any) { alert(`Không mở được bản RCA: ${err.message}`); }
    finally { setLoading(false); }
  };

  const viewItem = async (item: RcaAnalysisRecord) => {
    if (!item.id) return;
    setLoading(true);
    try { setViewingItem(await fetchRcaWithTimeline(item.id)); setViewMode('VIEW'); }
    catch (err: any) { alert(`Không mở được bản RCA: ${err.message}`); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!formData.scyk_id) { alert('Vui lòng chọn sự cố y khoa cần phân tích RCA'); return; }
    setSaving(true);
    try {
      const payload: RcaAnalysisRecord = { ...formData, nguoi_phan_tich: formData.nguoi_phan_tich || actor, bai_hoc_kinh_nghiem: lessonsText.split('\n').map(x => x.trim()).filter(Boolean), muc_do_ton_thuong_nguoi_benh: patientHarmLevel(formData), updated_by: actor || formData.updated_by || '' };
      delete (payload as any).id; delete (payload as any).created_at; delete (payload as any).updated_at;
      const saved = editingItem?.id ? await updateRcaAnalysis(editingItem.id, payload) : await addRcaAnalysis({ ...payload, created_by: actor || payload.created_by || '' });
      if (saved.id) await replaceRcaTimeline(saved.id, timelineRows);
      await loadData(); setEditingItem(null); setViewMode('LIST');
    } catch (err: any) { alert(`Lỗi lưu phân tích RCA: ${err.message}`); }
    finally { setSaving(false); }
  };

  const remove = async (item: RcaAnalysisRecord) => {
    if (!item.id || !window.confirm(`Xóa bản phân tích RCA ${item.ma_scyk || ''}?`)) return;
    try { await deleteRcaAnalysis(item.id); await loadData(); }
    catch (err: any) { alert(`Lỗi xóa RCA: ${err.message}`); }
  };

  const updateTimeline = (index: number, patch: Partial<RcaTimelineRow>) => setTimelineRows(prev => prev.map((row, idx) => idx === index ? { ...row, ...patch } : row));
  const addTimeline = () => setTimelineRows(prev => [...prev, emptyTimeline(prev.length + 1)]);
  const removeTimeline = (index: number) => setTimelineRows(prev => prev.filter((_, idx) => idx !== index).map((row, idx) => ({ ...row, thu_tu: idx + 1 })));

  const timelineTable = (editable: boolean, rows: RcaTimelineRow[]) => (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-[980px] w-full table-fixed text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
          <tr><th className="w-10 px-3 py-2">#</th><th className="w-36 px-3 py-2">Thời điểm</th><th className="w-36 px-3 py-2">Vị trí</th><th className="w-[31%] px-3 py-2">Lâm sàng</th><th className="w-[31%] px-3 py-2">Cận lâm sàng / xử trí</th>{editable && <th className="w-12 px-3 py-2" />}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => <tr key={row.id || index} className="align-top">
            <td className="px-3 py-2 font-bold text-slate-500">{index + 1}</td>
            {editable ? <>
              <td className="px-3 py-2"><input value={row.thoi_diem || ''} onChange={e => updateTimeline(index, { thoi_diem: e.target.value })} placeholder="VD: 11:45, 29/06/2026" className={inputClass} /></td>
              <td className="px-3 py-2"><input value={row.vi_tri || ''} onChange={e => updateTimeline(index, { vi_tri: e.target.value })} className={inputClass} /></td>
              <td className="px-3 py-2"><textarea rows={3} value={row.lam_sang || ''} onChange={e => updateTimeline(index, { lam_sang: e.target.value })} className={textareaClass} /></td>
              <td className="px-3 py-2"><textarea rows={3} value={row.can_lam_sang_xu_tri || ''} onChange={e => updateTimeline(index, { can_lam_sang_xu_tri: e.target.value })} className={textareaClass} /></td>
              <td className="px-3 py-2"><button type="button" onClick={() => removeTimeline(index)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={16} /></button></td>
            </> : <>
              <td className="px-3 py-2">{formatVietnamDateTime(row.thoi_diem) || row.thoi_diem}</td><td className="px-3 py-2">{row.vi_tri}</td><td className="px-3 py-2 whitespace-pre-wrap">{row.lam_sang}</td><td className="px-3 py-2 whitespace-pre-wrap">{row.can_lam_sang_xu_tri}</td>
            </>}
          </tr>)}
        </tbody>
      </table>
    </div>
  );

  const form = () => <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3"><button onClick={() => setViewMode('LIST')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft size={18} /></button><div><h2 className="text-base font-black text-slate-900">{editingItem ? 'Cập nhật phân tích RCA' : 'Báo cáo phân tích sự cố y khoa RCA'}</h2><p className="text-xs text-slate-500">Theo mẫu RCA.md, tự điền từ báo cáo và biên bản xác minh.</p></div></div>
      <button onClick={save} disabled={saving || prefilling} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? 'Đang lưu...' : 'Lưu RCA'}</button>
    </div>
    <div className="space-y-7 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <label className="block space-y-1.5 md:col-span-2"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Sự cố y khoa</span><select value={formData.scyk_id || ''} onChange={e => handleIncidentSelect(e.target.value)} disabled={Boolean(editingItem)} className={inputClass}><option value="">Chọn báo cáo sự cố...</option>{selectableIncidents.map(incident => <option key={incident.id} value={incident.id}>{incident.so_bc_ma_scyk || incident.id} - {incident.khoa_phong || incident.don_vi_bao_cao || 'Chưa rõ khoa'}</option>)}</select></label>
        <Field label="Ngày phân tích" type="date" value={formData.ngay_phan_tich} onChange={value => updateField('ngay_phan_tich', value)} />
        <label className="block space-y-1.5"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Người báo cáo RCA</span><input value={formData.nguoi_phan_tich || actor || ''} readOnly className={`${inputClass} bg-slate-50 text-slate-600`} /></label>
        <label className="block space-y-1.5"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Trạng thái</span><select value={formData.trang_thai || 'DRAFT'} onChange={e => updateField('trang_thai', e.target.value as any)} className={inputClass}>{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
      </div>
      {prefilling && <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">Đang tự điền thông tin từ báo cáo và biên bản xác minh...</div>}
      <Section title="Thông tin chung"><HeaderInfoFields /></Section>
      <PartHeading title="A. Dành cho nhân viên chuyên trách" />
      <Section title="I. Mô tả sự cố"><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{renderTextAreas(descriptionFields, numberedLabelClass)}</div></Section>
      <Section title="II. Phân loại sự cố theo nhóm sự cố"><IncidentGroupChecklist /></Section>
      <Section title="III. Phân loại sự cố theo nhóm nguyên nhân gây ra sự cố"><IncidentCauseChecklist /></Section>
      <Section title="IV. Diễn biến theo dấu chân người bệnh">{timelineTable(true, timelineRows)}<button type="button" onClick={addTimeline} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><Plus size={16} />Thêm mốc diễn biến</button></Section>
      <Section title="V. Phân tích lâm sàng - cận lâm sàng - y lệnh thực hiện và tính phù hợp của xử trí"><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{renderTextAreas(clinicalFields, numberedLabelClass)}</div></Section>
      <Section title="VI. Phân tích nguyên nhân gốc rễ"><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{renderTextAreas(causeFields)}</div></Section>
      <Section title="VII. Bài học kinh nghiệm"><TextArea label="Mỗi dòng là một bài học" value={lessonsText} onChange={setLessonsText} /></Section>
      <Section title="VIII. Khuyến nghị"><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{renderTextAreas(recommendationFields, numberedLabelClass)}</div></Section>
      <PartHeading title="B. Dành cho cấp quản lý" />
      <Section title="I. Đánh giá của trưởng nhóm chuyên gia">
        <div className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-slate-900">1. Mô tả kết quả phát hiện</span>
            <span className="block text-xs italic text-slate-400">(Không lặp lại nội dung mô tả sự cố)</span>
            <textarea rows={4} value={formData.mo_ta_ket_qua_phat_hien ?? ''} onChange={e => updateField('mo_ta_ket_qua_phat_hien', e.target.value)} className={textareaClass} />
          </label>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block text-sm font-bold text-slate-900">2. Đã thảo luận khuyến cáo/hướng xử lý với người báo cáo</span>
              <RadioGroup name="da_thao_luan_khuyen_cao" options={yesNoUnknownOptions} value={formData.da_thao_luan_khuyen_cao || ''} onChange={value => updateField('da_thao_luan_khuyen_cao', value)} />
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-bold text-slate-900">3. Phù hợp với các khuyến cáo chính thức đã ban hành</span>
              <RadioGroup name="phu_hop_khuyen_cao_chinh_thuc" options={yesNoUnknownOptions} value={formData.phu_hop_khuyen_cao_chinh_thuc || ''} onChange={value => updateField('phu_hop_khuyen_cao_chinh_thuc', value)} />
            </div>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-slate-900">4. Khuyến cáo áp dụng</span>
            <textarea rows={4} value={formData.khuyen_cao_ap_dung ?? ''} onChange={e => updateField('khuyen_cao_ap_dung', e.target.value)} className={textareaClass} />
          </label>
        </div>
      </Section>
      <Section title="II. Đánh giá mức độ tổn thương">
        <div className="mb-5 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          {harmLevelNoteLines.map(line => <p key={line}>{line}</p>)}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <span className="block text-sm font-bold text-slate-900">1. Trên người bệnh</span>
            <RadioGroup name="muc_do_ton_thuong_nguoi_benh" options={harmLevelOptions} value={patientHarmLevel(formData)} onChange={value => updateField('muc_do_ton_thuong_nguoi_benh', value)} layout="grid2" />
          </div>
          <div className="space-y-1.5">
            <span className="block text-sm font-bold text-slate-900">2. Trên tổ chức</span>
            <OrgHarmChecklist />
          </div>
        </div>
      </Section>
    </div>
  </div>;

  const emptyValue = <span className="italic text-slate-400">Chưa có</span>;
  const normalizedUnit = (value?: string) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const explicit = raw.match(/^([^\s-]+)\s+-\s+(.+)$/);
    if (explicit) return `${explicit[2]} (${explicit[1]})`;
    const lower = raw.toLowerCase();
    const unit = units.find(u => u.ten_don_vi.toLowerCase() === lower || u.ma_don_vi.toLowerCase() === lower || raw.includes(u.ten_don_vi) || raw.includes(u.ma_don_vi));
    if (!unit) return raw;
    return `${unit.ten_don_vi} (${unit.ma_don_vi})`;
  };
  const patientSummary = (record: RcaAnalysisRecord) => {
    const patientCode = String(record.ma_nguoi_benh || '').split(' - ')[0].trim();
    const demographics = [record.gioi, record.tuoi ? `${record.tuoi} tuổi` : ''].filter(Boolean).join(', ');
    return [patientCode, demographics].filter(Boolean).join(' - ');
  };
  const timeWithUnit = (time?: string, unit?: string) => [formatVietnamDateTime(time) || time || '', normalizedUnit(unit)].filter(Boolean);
  const generalInfoRows = (record: RcaAnalysisRecord) => [
    ['Mã sự cố', record.ma_scyk || '', 'Ngày phân tích', fmt(record.ngay_phan_tich)],
    ['Người bệnh (mã)', patientSummary(record), 'Vào viện', formatVietnamDateTime(record.thoi_gian_vao_vien) || record.thoi_gian_vao_vien || ''],
    ['Vào khoa\nKhoa xảy ra sự cố', timeWithUnit(record.vao_khoa_luc, record.khoa_xay_ra_su_co), 'Khoa tiếp nhận\nsau', timeWithUnit(record.khoa_tiep_nhan_luc, record.khoa_tiep_nhan_sau)],
    ['Thời điểm sự cố', formatVietnamDateTime(record.thoi_diem_su_co) || record.thoi_diem_su_co || '', 'Phân loại', record.tinh_bao_cao || ''],
    ['Người báo cáo RCA', record.nguoi_phan_tich || record.created_by || '', '', ''],
  ] as Array<[string, any, string, any]>;
  const CellValue = ({ value }: { value: any }) => Array.isArray(value)
    ? <div className="space-y-0.5">{value.map((line, idx) => <div key={idx}>{line || emptyValue}</div>)}</div>
    : <>{value || emptyValue}</>;
  const GeneralInfoTable = ({ record }: { record: RcaAnalysisRecord }) => (
    <div className="overflow-x-auto">
      <table className="min-w-[760px] w-full border-collapse text-[13px] leading-snug text-slate-900">
        <tbody>{generalInfoRows(record).map(([label1, value1, label2, value2]) => (
          <tr key={`${label1}-${label2}`}>
            <th className="w-[21%] whitespace-pre-line border border-slate-400 px-2 py-1.5 text-left align-middle font-black">{label1}</th>
            <td className="w-[33%] border border-slate-400 px-2 py-1.5 align-middle"><CellValue value={value1} /></td>
            <th className="w-[18%] whitespace-pre-line border border-slate-400 px-2 py-1.5 text-left align-middle font-black">{label2}</th>
            <td className="w-[28%] border border-slate-400 px-2 py-1.5 align-middle"><CellValue value={value2} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
  const InlineDetail = ({ label, value }: { label: string; value: any }) => <p className="text-sm leading-relaxed text-slate-800"><strong>{label}:</strong> <span className="whitespace-pre-wrap">{value || emptyValue}</span></p>;
  const BlockDetail = ({ label, value }: { label: string; value: any }) => <div><p className="text-sm font-black text-slate-950">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{value || emptyValue}</p></div>;
  const normalizeHarmLevel = (value: any) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const exact = harmLevelOptions.find(option => option === raw);
    if (exact) return exact;
    const upper = raw.toUpperCase();
    const letter = upper.match(/^([A-I])(?:\s|\.|-|$)/)?.[1];
    if (letter) return harmLevelOptions.find(option => option.startsWith(`${letter} -`)) || raw;
    const nc = upper.match(/NC[0-3]/)?.[0];
    if (nc) return harmLevelOptions.find(option => option.includes(`(${nc})`)) || raw;
    return raw;
  };
  const patientHarmLevel = (record: RcaAnalysisRecord) => {
    const source = record as RcaAnalysisRecord & Record<string, any>;
    return normalizeHarmLevel(
      source.muc_do_ton_thuong_nguoi_benh ||
      source.tren_nguoi_benh ||
      source.danh_gia_tren_nguoi_benh ||
      source.ton_thuong_nguoi_benh ||
      source.muc_do_ton_hai ||
      source.phan_loai_ban_dau ||
      source.muc_do_anh_huong ||
      ''
    );
  };
  const PatientHarmChecklistView = ({ record }: { record: RcaAnalysisRecord }) => {
    const selected = patientHarmLevel(record);
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
        {harmLevelOptions.map(option => (
          <label key={option} className="flex items-start gap-2 text-sm text-slate-800">
            <input type="radio" checked={selected === option} onChange={() => undefined} className="mt-0.5" />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  };  const oneColumnDetails = (record: RcaAnalysisRecord, fields: Array<[keyof RcaAnalysisRecord, string, string?]>) => <div className="space-y-4">{fields.map(([key, label]) => <BlockDetail key={String(key)} label={label} value={record[key]} />)}</div>;
  const joinedText = (...values: any[]) => values.map(value => String(value || '').trim()).filter(Boolean).join('\n');
  const recommendationSections = (record: RcaAnalysisRecord): Array<[string, string]> => [
    ['1. Giải pháp hệ thống', joinedText(record.khuyen_nghi_he_thong, record.khuyen_nghi_cong_cu_quy_trinh, record.khuyen_nghi_phan_mem_cntt, record.khuyen_nghi_kiem_tra_giam_sat)],
    ['2. Xem xét trách nhiệm cá nhân', joinedText(record.xem_xet_trach_nhiem_hanh_chinh_hs, record.xem_xet_trach_nhiem_chuyen_mon_theo_doi)],
  ];
  const recommendationDetails = (record: RcaAnalysisRecord) => <div className="space-y-4">{recommendationSections(record).map(([label, value]) => <BlockDetail key={label} label={label} value={value} />)}</div>;
  const resultTable = (rows: Array<[string, any]>) => <div className="overflow-x-auto rounded-xl border border-slate-300"><table className="min-w-[720px] w-full border-collapse text-sm"><thead><tr className="bg-slate-50"><th className="w-48 whitespace-nowrap border border-slate-300 px-4 py-3 text-center text-base font-black text-slate-900">Tiêu chí</th><th className="border border-slate-300 px-4 py-3 text-center text-base font-black text-slate-900">Kết quả</th></tr></thead><tbody>{rows.map(([label, value]) => <tr key={label}><td className="w-48 whitespace-nowrap border border-slate-300 px-4 py-3 align-top text-sm font-black text-slate-900">{label}</td><td className="border border-slate-300 px-4 py-3 align-top whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{value || emptyValue}</td></tr>)}</tbody></table></div>;
  const IncidentGroupChecklistView = ({ record }: { record: RcaAnalysisRecord }) => {
    const checked = record.phan_loai_nhom_su_co || [];
    return (
      <div className="space-y-4">
        {incidentGroupCategories.map(cat => (
          <div key={cat.group}>
            <p className="mb-1.5 text-sm font-bold text-slate-900">{cat.group}</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-3">
              {cat.items.map(item => (
                <p key={item} className="text-sm text-slate-800"><span className="mr-1.5">{checked.includes(item) ? '☑' : '☐'}</span>{item}</p>
              ))}
            </div>
          </div>
        ))}
        <p className="text-sm text-slate-800"><span className="mr-1.5 font-bold">Khác:</span>{record.phan_loai_nhom_su_co_khac || emptyValue}</p>
      </div>
    );
  };
  const IncidentCauseChecklistView = ({ record }: { record: RcaAnalysisRecord }) => {
    const checked = record.phan_loai_nhom_nguyen_nhan || [];
    return (
      <div className="space-y-4">
        {incidentCauseCategories.map(cat => (
          <div key={cat.group}>
            <p className="mb-1.5 text-sm font-bold text-slate-900">{cat.group}</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-3">
              {cat.items.map(item => (
                <p key={item} className="text-sm text-slate-800"><span className="mr-1.5">{checked.includes(groupItemKey(cat.group, item)) ? '☑' : '☐'}</span>{item}</p>
              ))}
            </div>
          </div>
        ))}
        <p className="text-sm text-slate-800"><span className="mr-1.5 font-bold">Khác:</span>{record.phan_loai_nhom_nguyen_nhan_khac || emptyValue}</p>
      </div>
    );
  };
  const OrgHarmChecklistView = ({ record }: { record: RcaAnalysisRecord }) => {
    const checked = record.ton_thuong_to_chuc || [];
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
          {orgHarmOptions.map(item => (
            <p key={item} className="text-sm text-slate-800"><span className="mr-1.5">{checked.includes(item) ? '☑' : '☐'}</span>{item}</p>
          ))}
        </div>
        {checked.includes('Khác') && <p className="text-sm text-slate-800"><span className="mr-1.5 font-bold">Nếu chọn Khác:</span>{record.ton_thuong_to_chuc_khac || emptyValue}</p>}
      </div>
    );
  };
  const causeTable = (record: RcaAnalysisRecord) => resultTable([
    ['1. Người bệnh', record.yeu_to_nguoi_benh],
    ['2. Nhân viên', record.yeu_to_nhan_vien],
    ['3. Môi trường/Thiết bị', record.yeu_to_moi_truong_thiet_bi],
    ['4. Quy trình/Nhiệm vụ', record.yeu_to_quy_trinh_nhiem_vu],
    ['5. Tổ chức/Quản lý', record.yeu_to_to_chuc_quan_ly],
  ]);

  const esc = (value: any) => String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch));
  const nl = (value: any) => esc(value || '.........................................................').replace(/\n/g, '<br>');
  const exportRcaReport = (record: RcaAnalysisWithTimeline) => {
    const checkedGroupItems = record.phan_loai_nhom_su_co || [];
    const incidentGroupChecklistHtml = incidentGroupCategories.map(cat => `<div class="group-title">${esc(cat.group)}</div><div class="checklist">${cat.items.map(item => `<div class="check-item">${checkedGroupItems.includes(item) ? '☑' : '☐'} ${esc(item)}</div>`).join('')}</div>`).join('')
      + `<div class="check-item"><strong>Khác:</strong> ${esc(record.phan_loai_nhom_su_co_khac || '.........................................................')}</div>`;
    const checkedCauseItems = record.phan_loai_nhom_nguyen_nhan || [];
    const incidentCauseChecklistHtml = incidentCauseCategories.map(cat => `<div class="group-title">${esc(cat.group)}</div><div class="checklist">${cat.items.map(item => `<div class="check-item">${checkedCauseItems.includes(groupItemKey(cat.group, item)) ? '☑' : '☐'} ${esc(item)}</div>`).join('')}</div>`).join('')
      + `<div class="check-item"><strong>Khác:</strong> ${esc(record.phan_loai_nhom_nguyen_nhan_khac || '.........................................................')}</div>`;
    const checkedOrgHarmItems = record.ton_thuong_to_chuc || [];
    const selectedPatientHarm = patientHarmLevel(record);
    const patientHarmChecklistHtml = `<div class="checklist">${harmLevelOptions.map(option => `<div class="check-item">${selectedPatientHarm === option ? '◉' : '○'} ${esc(option)}</div>`).join('')}</div>`;
    const orgHarmChecklistHtml = `<div class="checklist">${orgHarmOptions.map(item => `<div class="check-item">${checkedOrgHarmItems.includes(item) ? '☑' : '☐'} ${esc(item)}</div>`).join('')}</div>`
      + (checkedOrgHarmItems.includes('Khác') ? `<div class="check-item"><strong>Nếu chọn Khác:</strong> ${esc(record.ton_thuong_to_chuc_khac || '.........................................................')}</div>` : '');
    const causeRows = [
      ['1. Người bệnh', record.yeu_to_nguoi_benh],
      ['2. Nhân viên', record.yeu_to_nhan_vien],
      ['3. Môi trường/Thiết bị', record.yeu_to_moi_truong_thiet_bi],
      ['4. Quy trình/Nhiệm vụ', record.yeu_to_quy_trinh_nhiem_vu],
      ['5. Tổ chức/Quản lý', record.yeu_to_to_chuc_quan_ly],
    ];
    const tableRows = (rows: Array<[string, any]>) => rows.map(([label, value]) => `<tr><td class="label">${esc(label)}</td><td>${nl(value)}</td></tr>`).join('');
    const timeline = (record.timeline || []).map(row => `<tr><td>${esc(formatVietnamDateTime(row.thoi_diem) || row.thoi_diem)}</td><td>${esc(row.vi_tri)}</td><td>${nl(row.lam_sang)}</td><td>${nl(row.can_lam_sang_xu_tri)}</td></tr>`).join('');
    const lessons = (record.bai_hoc_kinh_nghiem || []).map(item => `<li>${esc(item)}</li>`).join('') || '<li>.........................................................</li>';
    const recommendationHtml = recommendationSections(record).map(([label, value]) => `<div class="block"><div class="block-title">${esc(label)}</div><div>${nl(value)}</div></div>`).join('');
    const htmlValue = (value: any) => Array.isArray(value)
      ? `<div class="stack">${value.map(line => `<div>${esc(line || '')}</div>`).join('')}</div>`
      : esc(value || '');
    const generalInfoHtml = generalInfoRows(record).filter(([label1]) => label1 !== 'Người báo cáo RCA').map(([label1, value1, label2, value2]) => `<tr><th>${esc(label1).replace(/\\n/g, '<br>')}</th><td>${htmlValue(value1)}</td><th>${esc(label2).replace(/\\n/g, '<br>')}</th><td>${htmlValue(value2)}</td></tr>`).join('');
const pdfFileName = `RCA-${String(record.ma_scyk || 'bao-cao').replace(/[\/:*?"<>|]+/g, '-')}.pdf`;
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>RCA ${esc(record.ma_scyk || '')}</title><style>
      @page{size:A4;margin:20mm 16mm 20mm 20mm} html{background:#fff;color-scheme:light} *,*::before,*::after{box-sizing:border-box;font-family:'Times New Roman',Times,serif!important} body{font-family:'Times New Roman',Times,serif!important;color:#111;background:#fff;line-height:1.45;max-width:980px;margin:0 auto;font-size:14pt!important;text-align:justify} .doc-head{display:grid;grid-template-columns:0.9fr 1.8fr;gap:28px;align-items:start;margin-bottom:60px;text-align:center}.org,.nation{font-size:13pt!important;font-weight:700;line-height:1.2;text-transform:uppercase;white-space:nowrap}.org .under,.nation .under{display:inline-block;border-bottom:2px solid #111;padding-bottom:1px}.nation .motto{font-size:13pt!important;text-transform:none;white-space:nowrap} h1{text-align:center;margin:0;font-size:18pt;font-weight:800;text-transform:uppercase} h2{text-align:center;margin:4px 0 24px;font-size:14pt;font-style:italic;font-weight:400} h3{margin:18px 0 8px;font-size:14pt;font-weight:800;text-transform:uppercase;text-align:left}.part-title{margin:24px 0 8px;font-size:15pt;font-weight:800;text-transform:uppercase;text-align:left;border-bottom:2px solid #111;padding-bottom:5px} table{width:100%;border-collapse:collapse;margin:10px 0 16px;text-align:justify;font-size:14pt!important;line-height:1.25} th,td{border:1px solid #222;padding:6px 8px;vertical-align:middle;text-align:left} th{font-weight:800;background:#f3f4f6} thead th{text-align:center}.info-table{table-layout:fixed}.info-table th{width:20%;white-space:normal}.info-table td{width:30%}.stack div{white-space:normal}.label{width:190px;white-space:nowrap;font-weight:800}.inline-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 28px;margin:14px 0}.line{margin:0}.line strong{font-weight:800}.block{margin:8px 0 12px;text-align:justify}.block-title{font-weight:800;text-align:left}.group-title{font-weight:800;margin:10px 0 4px;text-align:left}.checklist{display:grid;grid-template-columns:1fr 1fr;gap:2px 20px;margin-bottom:4px}.check-item{font-size:12pt;text-align:left}.note{margin:6px 0 14px;padding:8px 10px;border:1px solid #999;background:#f7f7f7;font-size:11pt}.note p{margin:2px 0}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:0 24px;align-items:start}.two-col .checklist{grid-template-columns:1fr}.root{font-weight:800}.muted{color:#666}.signature{display:grid;grid-template-columns:1fr 1fr;margin-top:34px;text-align:center;page-break-inside:avoid}.signature .box{min-height:110px}.signature .role{font-weight:800}.signature .name{margin-top:70px;font-weight:800}.actions{position:sticky;top:0;z-index:10;margin:0 0 18px;padding:10px 0;background:#fff;text-align:right}.actions button{border:1px solid #0f766e;background:#0f766e;color:#fff;border-radius:6px;padding:7px 12px;font-size:13px!important;font-weight:700;cursor:pointer}body.pdf-export{width:658px!important;max-width:658px!important;margin:0!important}.pdf-export .actions{display:none!important}@media print{.actions{display:none} body{max-width:none}}
      </style></head><body><div class="actions"><button onclick="downloadReportPdf(this)">Tải báo cáo PDF</button></div><div class="doc-head"><div class="org"><div>BỆNH VIỆN QUÂN Y 103</div><div class="under">BAN QUẢN LÝ CHẤT LƯỢNG</div></div><div class="nation"><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="under motto">Độc lập - Tự do - Hạnh phúc</div></div></div><h1>Báo cáo phân tích sự cố y khoa</h1><h2>(Phân tích nguyên nhân gốc rễ - RCA)</h2>
      <table class="info-table"><tbody>${generalInfoHtml}</tbody></table>
      <div class="part-title">A. Dành cho nhân viên chuyên trách</div>
      <h3>I. Mô tả sự cố</h3><div class="block"><div class="block-title">1. Tiền sử / bệnh sử</div><div>${nl(record.tien_su_benh_su)}</div></div><div class="block"><div class="block-title">2. Chẩn đoán ban đầu</div><div>${nl(record.chan_doan_ban_dau)}</div></div><div class="block"><div class="block-title">3. Diễn biến sự cố</div><div>${nl(record.dien_bien_su_co)}</div></div><div class="block"><div class="block-title">4. Xử trí sự cố</div><div>${nl(record.xu_tri_su_co)}</div></div><div class="block"><div class="block-title">5. Diễn tiến sau sự cố</div><div>${nl(record.dien_tien_sau_su_co)}</div></div>
      <h3>II. Phân loại sự cố theo nhóm sự cố</h3>${incidentGroupChecklistHtml}
      <h3>III. Phân loại sự cố theo nhóm nguyên nhân gây ra sự cố</h3>${incidentCauseChecklistHtml}
      <h3>IV. Diễn biến theo dấu chân người bệnh</h3><table><thead><tr><th>Thời điểm</th><th>Vị trí</th><th>Lâm sàng</th><th>Cận lâm sàng / Xử trí</th></tr></thead><tbody>${timeline || '<tr><td></td><td></td><td></td><td></td></tr>'}</tbody></table>
      <h3>V. Phân tích lâm sàng - cận lâm sàng - y lệnh thực hiện và tính phù hợp của xử trí</h3><div class="block"><div class="block-title">1. Giai đoạn chẩn đoán và tiếp nhận</div><div>${nl(record.phan_tich_chan_doan_tiep_nhan)}</div></div><div class="block"><div class="block-title">2. Theo dõi trước sự cố</div><div>${nl(record.phan_tich_theo_doi_truoc_su_co)}</div></div><div class="block"><div class="block-title">3. Cấp cứu khi xảy ra sự cố</div><div>${nl(record.phan_tich_cap_cuu_khi_su_co)}</div></div><div class="block"><div class="block-title">4. Hồi sức sau sự cố</div><div>${nl(record.phan_tich_hoi_suc_sau_su_co)}</div></div><div class="block"><div class="block-title">5. Kết luận</div><div>${nl(record.ket_luan_phu_hop_xu_tri)}</div></div><div class="block"><div class="block-title">6. Mô tả hành động xử lý sự cố</div><div>${nl(record.mo_ta_hanh_dong_xu_ly_su_co)}</div></div>
      <h3>VI. Phân tích nguyên nhân gốc rễ (5 nhóm yếu tố)</h3><table><thead><tr><th>Nhóm yếu tố</th><th>Yếu tố đóng góp được nhận diện</th></tr></thead><tbody>${tableRows(causeRows)}</tbody></table><p class="root">Nguyên nhân gốc rễ xác định: ${nl(record.nguyen_nhan_goc_re)}</p><p><strong>Các vấn đề phát hiện thêm:</strong> ${nl(record.van_de_phat_hien_them)}</p>
      <h3>VII. Bài học kinh nghiệm</h3><ul>${lessons}</ul>
      <h3>VIII. Khuyến nghị</h3>${recommendationHtml}
      <div class="part-title">B. Dành cho cấp quản lý</div>
      <h3>I. Đánh giá của trưởng nhóm chuyên gia</h3><div class="block"><div class="block-title">1. Mô tả kết quả phát hiện <span class="muted">(Không lặp lại nội dung mô tả sự cố)</span></div><div>${nl(record.mo_ta_ket_qua_phat_hien)}</div></div><div class="two-col"><p><strong>2. Đã thảo luận khuyến cáo/hướng xử lý với người báo cáo:</strong> ${esc(record.da_thao_luan_khuyen_cao || '.........................................................')}</p><p><strong>3. Phù hợp với các khuyến cáo chính thức đã ban hành:</strong> ${esc(record.phu_hop_khuyen_cao_chinh_thuc || '.........................................................')}</p></div><div class="block"><div class="block-title">4. Khuyến cáo áp dụng</div><div>${nl(record.khuyen_cao_ap_dung)}</div></div>
      <h3>II. Đánh giá mức độ tổn thương</h3><div class="note">${harmLevelNoteLines.map(line => `<p>${esc(line)}</p>`).join('')}</div><div class="two-col"><div><div class="block-title">1. Trên người bệnh</div>${patientHarmChecklistHtml}</div><div><div class="block-title">2. Trên tổ chức</div>${orgHarmChecklistHtml}</div></div>
      <div class="signature"><div></div><div class="box"><div class="role">Người báo cáo RCA</div><div class="muted">(Ký, ghi rõ họ tên)</div><div class="name">${esc(record.nguoi_phan_tich || record.created_by || '')}</div></div></div>
      <script>
function loadPdfScript(src,key){return new Promise(function(resolve,reject){if(window[key]){resolve();return;}var existing=document.querySelector('script[src="'+src+'"]');if(existing){existing.addEventListener('load',resolve);existing.addEventListener('error',reject);return;}var script=document.createElement('script');script.src=src;script.async=true;script.onload=resolve;script.onerror=function(){reject(new Error('Không tải được thư viện PDF'));};document.head.appendChild(script);});}
async function downloadReportPdf(button){var oldText=button.textContent;button.disabled=true;button.textContent='Đang tạo PDF...';try{await loadPdfScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','jspdf');await loadPdfScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','html2canvas');var body=document.body;var pdfHtmlWidth=658;body.classList.add('pdf-export');var canvas=await window.html2canvas(body,{scale:2,useCORS:true,backgroundColor:'#ffffff',width:pdfHtmlWidth,windowWidth:pdfHtmlWidth,scrollX:0,scrollY:0,ignoreElements:function(el){return el.classList&&el.classList.contains('actions');}});var pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});var pageW=210,pageH=297,marginTop=20,marginBottom=20,marginLeft=20,marginRight=16,contentW=pageW-marginLeft-marginRight,contentH=pageH-marginTop-marginBottom;var imgW=contentW;var pxPerMm=canvas.width/imgW;var pagePxH=Math.floor(contentH*pxPerMm);var canvasCtx=canvas.getContext('2d');var domScale=2;var bodyRect=body.getBoundingClientRect();var tableHeaders=Array.prototype.slice.call(document.querySelectorAll('table')).map(function(table){var thead=table.querySelector('thead');if(!thead)return null;var tableRect=table.getBoundingClientRect();var headRect=thead.getBoundingClientRect();return{top:Math.round((tableRect.top-bodyRect.top)*domScale),bottom:Math.round((tableRect.bottom-bodyRect.top)*domScale),headTop:Math.round((headRect.top-bodyRect.top)*domScale),headHeight:Math.max(1,Math.round(headRect.height*domScale))};}).filter(Boolean);function repeatedHeader(startY){for(var i=0;i<tableHeaders.length;i++){var t=tableHeaders[i];if(startY>t.top+t.headHeight+2&&startY<t.bottom-2)return t;}return null;}function isBlankRow(rowY){var data=canvasCtx.getImageData(0,rowY,canvas.width,1).data;var dark=0;for(var i=0;i<data.length;i+=32){if(data[i]<245||data[i+1]<245||data[i+2]<245){dark++;if(dark>canvas.width/160)return false;}}return true;}function findCut(startY,targetH){var maxY=Math.min(canvas.height,startY+targetH);if(maxY>=canvas.height)return canvas.height;var minCut=startY+Math.floor(targetH*0.62);var search=Math.min(180,Math.floor(targetH*0.18));for(var y=maxY;y>=Math.max(minCut,maxY-search);y--){if(isBlankRow(y)&&isBlankRow(Math.max(0,y-2))&&isBlankRow(Math.min(canvas.height-1,y+2)))return y;}for(var y=maxY+1;y<=Math.min(canvas.height-1,maxY+60);y++){if(isBlankRow(y)&&isBlankRow(Math.max(0,y-2))&&isBlankRow(Math.min(canvas.height-1,y+2)))return y;}return maxY;}var y=0,page=0;while(y<canvas.height){if(page>0)pdf.addPage();var head=repeatedHeader(y);var headH=head?Math.min(head.headHeight,Math.floor(pagePxH*0.18)):0;var availableH=Math.max(1,pagePxH-headH);var cutY=findCut(y,availableH);var sliceH=Math.max(1,cutY-y);var tmp=document.createElement('canvas');tmp.width=canvas.width;tmp.height=pagePxH;var ctx=tmp.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,tmp.width,tmp.height);if(headH>0){ctx.drawImage(canvas,0,head.headTop,canvas.width,head.headHeight,0,0,canvas.width,headH);}ctx.drawImage(canvas,0,y,canvas.width,sliceH,0,headH,canvas.width,sliceH);pdf.addImage(tmp.toDataURL('image/jpeg',0.95),'JPEG',marginLeft,marginTop,contentW,contentH);y=cutY;page++;}pdf.save('${esc(pdfFileName)}');}catch(error){alert((error&&error.message)||'Không tạo được PDF');}finally{document.body.classList.remove('pdf-export');button.disabled=false;button.textContent=oldText;}}
</script></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); return; }
    alert('Không mở được cửa sổ báo cáo. Vui lòng cho phép popup để tải PDF.');
  };
  const view = () => {
    if (!viewingItem) return null;
    return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3"><button onClick={() => setViewMode('LIST')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft size={18} /></button><div><h2 className="text-base font-black text-slate-900">Báo cáo phân tích RCA</h2><p className="text-xs text-slate-500">{viewingItem.ma_scyk || 'Chưa có mã'} - {statusLabel(viewingItem.trang_thai)}</p></div></div>
        <div className="flex items-center gap-2"><button onClick={() => exportRcaReport(viewingItem)} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white hover:bg-primary-700"><Download size={16} />Xuất báo cáo</button><button onClick={() => editItem(viewingItem)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><Edit2 size={16} />Sửa</button></div>
      </div>
      <div className="space-y-7 p-4 md:p-6">
        <Section title="Thông tin chung"><GeneralInfoTable record={viewingItem} /></Section>
        <PartHeading title="A. Dành cho nhân viên chuyên trách" />
        <Section title="I. Mô tả sự cố">{oneColumnDetails(viewingItem, descriptionFields)}</Section>
        <Section title="II. Phân loại sự cố theo nhóm sự cố"><IncidentGroupChecklistView record={viewingItem} /></Section>
        <Section title="III. Phân loại sự cố theo nhóm nguyên nhân gây ra sự cố"><IncidentCauseChecklistView record={viewingItem} /></Section>
        <Section title="IV. Diễn biến theo dấu chân người bệnh">{timelineTable(false, viewingItem.timeline || [])}</Section>
        <Section title="V. Phân tích lâm sàng - cận lâm sàng - y lệnh thực hiện và tính phù hợp của xử trí">{oneColumnDetails(viewingItem, clinicalFields)}</Section>
        <Section title="VI. Phân tích nguyên nhân gốc rễ">{causeTable(viewingItem)}<div className="mt-4 space-y-4"><BlockDetail label="Nguyên nhân gốc rễ xác định" value={viewingItem.nguyen_nhan_goc_re} /><BlockDetail label="Vấn đề phát hiện thêm" value={viewingItem.van_de_phat_hien_them} /></div></Section>
        <Section title="VII. Bài học kinh nghiệm"><BlockDetail label="Bài học" value={(viewingItem.bai_hoc_kinh_nghiem || []).join('\n')} /></Section>
        <Section title="VIII. Khuyến nghị">{recommendationDetails(viewingItem)}</Section>
        <PartHeading title="B. Dành cho cấp quản lý" />
        <Section title="I. Đánh giá của trưởng nhóm chuyên gia">
          <div className="space-y-4">
            <BlockDetail label="1. Mô tả kết quả phát hiện" value={viewingItem.mo_ta_ket_qua_phat_hien} />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <InlineDetail label="2. Đã thảo luận khuyến cáo/hướng xử lý với người báo cáo" value={viewingItem.da_thao_luan_khuyen_cao} />
              <InlineDetail label="3. Phù hợp với các khuyến cáo chính thức đã ban hành" value={viewingItem.phu_hop_khuyen_cao_chinh_thuc} />
            </div>
            <BlockDetail label="4. Khuyến cáo áp dụng" value={viewingItem.khuyen_cao_ap_dung} />
          </div>
        </Section>
        <Section title="II. Đánh giá mức độ tổn thương">
          <div className="mb-4 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
            {harmLevelNoteLines.map(line => <p key={line}>{line}</p>)}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-black text-slate-950">1. Trên người bệnh</p>
              <PatientHarmChecklistView record={viewingItem} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-black text-slate-950">2. Trên tổ chức</p>
              <OrgHarmChecklistView record={viewingItem} />
            </div>
          </div>
        </Section>
      </div>
    </div>;
  };
  if (viewMode === 'FORM') return form();
  if (viewMode === 'VIEW') return view();

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><ClipboardList size={22} /></div><div><h2 className="text-lg font-black text-slate-900">Phân tích RCA sự cố y khoa</h2><p className="text-sm text-slate-500">Lập báo cáo phân tích nguyên nhân gốc rễ theo mẫu RCA.md.</p></div></div>
      <button onClick={resetForm} className="btn-primary"><Plus size={16} />Tạo RCA</button>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm mã sự cố, khoa, nguyên nhân..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></div>
        <span className="text-sm font-bold text-slate-500">{filteredItems.length} bản RCA</span>
      </div>
      {loading && <div className="p-8 text-center text-slate-500"><Loader2 className="mx-auto mb-2 animate-spin" />Đang tải...</div>}
      {error && <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && filteredItems.length === 0 && <div className="p-8 text-center text-slate-500">Chưa có bản phân tích RCA phù hợp.</div>}
      {!loading && !error && filteredItems.length > 0 && <div className="overflow-x-auto"><table className="min-w-[980px] w-full table-fixed text-sm">
        <colgroup><col className="w-[17%]" /><col className="w-[12%]" /><col className="w-[21%]" /><col className="w-[28%]" /><col className="w-[10%]" /><col className="w-[12%]" /></colgroup>
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Mã sự cố</th><th className="px-4 py-3">Ngày phân tích</th><th className="px-4 py-3">Khoa</th><th className="px-4 py-3">Mức độ</th><th className="px-3 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">
        {filteredItems.map(item => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-4 py-3 font-bold text-slate-900"><FileText size={16} className="mr-2 inline text-primary-600" />{item.ma_scyk || 'Chưa có mã'}</td><td className="px-4 py-3 text-slate-600">{fmt(item.ngay_phan_tich)}</td><td className="px-4 py-3 text-slate-600">{item.khoa_xay_ra_su_co || '-'}</td><td className="px-4 py-3 text-slate-600 whitespace-normal leading-snug">{patientHarmLevel(item) || '-'}</td><td className="px-3 py-3"><span className="inline-flex max-w-full rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold leading-tight text-slate-700">{statusLabel(item.trang_thai)}</span></td><td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-1"><button onClick={() => viewItem(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary-600"><Eye size={16} /></button><button onClick={() => editItem(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-amber-600"><Edit2 size={16} /></button><button onClick={() => remove(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div></td></tr>)}
      </tbody></table></div>}
    </div>
  </div>;
};

export default IncidentAnalysis;
