/**
 * Bảng kiểm An toàn Phẫu thuật/Thủ thuật - 23 tiêu chí
 * (Phụ lục II, BVQY103.QLCL.QĐ.04.V3) dùng cho chỉ số IPSG.04.00 / 04.01.
 *
 * Mỗi tiêu chí nhận 1 trong 3 giá trị: "Có" | "Không" | "Không áp dụng".
 * Tiêu chí "Không áp dụng" được LOẠI khỏi mẫu số khi tính tỷ lệ đạt.
 */

export type AtptAnswer = 'Có' | 'Không' | 'Không áp dụng';
export const ATPT_ANSWERS: AtptAnswer[] = ['Có', 'Không', 'Không áp dụng'];

export interface AtptCriterion {
  id: string;
  group: 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';
  /** Nhãn ngắn dùng cho cột raw data */
  short: string;
  /** Nhãn đầy đủ dùng trong báo cáo */
  label: string;
}

export const ATPT_GROUPS = {
  SIGN_IN: 'Sign-in (Xác thực thông tin trước PT/TT)',
  TIME_OUT: 'Time-out (Tạm dừng an toàn)',
  SIGN_OUT: 'Sign-out (Kiểm tra, xác nhận sau PT/TT)'
} as const;

export const ATPT_CRITERIA: AtptCriterion[] = [
  // --- Sign-in: 10 tiêu chí ---
  { id: 'SI1', group: 'SIGN_IN', short: 'Xác nhận đúng NB (họ tên + NTNS)', label: 'SI1: Xác nhận đúng người bệnh bằng ít nhất 2 thông số định danh (họ tên + ngày tháng năm sinh)' },
  { id: 'SI2', group: 'SIGN_IN', short: 'Xác nhận đúng loại PT/TT và phương pháp DK', label: 'SI2: Xác nhận đúng loại PT/TT và phương pháp dự kiến' },
  { id: 'SI3', group: 'SIGN_IN', short: 'Xác nhận vị trí, bên, tầng, cấu trúc + dấu đánh dấu', label: 'SI3: Xác nhận đúng vị trí, bên, tầng, cấu trúc PT/TT; kiểm tra dấu đánh dấu trên NB' },
  { id: 'SI4', group: 'SIGN_IN', short: 'Xác nhận phiếu cam kết PT/TT/GMHS/truyền máu', label: 'SI4: Xác nhận phiếu cam kết PT/TT/GMHS/truyền máu đã có đầy đủ chữ ký' },
  { id: 'SI5', group: 'SIGN_IN', short: 'Xác nhận HS, XN, phim CĐHA sẵn sàng, đúng tên', label: 'SI5: Xác nhận hồ sơ, xét nghiệm, phim CĐHA đã sẵn sàng, đúng tên NB, hiển thị rõ ràng' },
  { id: 'SI6', group: 'SIGN_IN', short: 'BS gây mê đánh dấu vị trí gây tê vùng', label: 'SI6: Bác sĩ gây mê đánh dấu vị trí gây tê vùng/phong bế thần kinh' },
  { id: 'SI7', group: 'SIGN_IN', short: 'Đánh giá nguy cơ mất máu >500mL, chuẩn bị máu', label: 'SI7: Đánh giá nguy cơ mất máu >500mL, đã chuẩn bị chế phẩm máu' },
  { id: 'SI8', group: 'SIGN_IN', short: 'Chuẩn bị đủ thiết bị/vật tư cấy ghép', label: 'SI8: Chuẩn bị đủ, đúng loại, đúng kích cỡ, còn hạn thiết bị/vật tư cấy ghép' },
  { id: 'SI9', group: 'SIGN_IN', short: 'Đánh giá nguy cơ khó đặt NKQ/hít sặc, trào ngược', label: 'SI9: Đánh giá nguy cơ khó đặt nội khí quản/nguy cơ hít sặc, trào ngược' },
  { id: 'SI10', group: 'SIGN_IN', short: 'Khai thác đầy đủ tiền sử dị ứng', label: 'SI10: Khai thác đầy đủ tiền sử dị ứng' },

  // --- Time-out: 8 tiêu chí ---
  { id: 'TO1', group: 'TIME_OUT', short: 'Tuyên bố bắt đầu tạm dừng an toàn', label: 'TO1: Tuyên bố bắt đầu tạm dừng an toàn, toàn ê-kíp dừng mọi hoạt động' },
  { id: 'TO2', group: 'TIME_OUT', short: 'Xác nhận bằng lời NB, PT/TT, vị trí/dấu đánh dấu', label: 'TO2: Xác nhận bằng lời: họ tên/NTNS, PT/TT, vị trí/bên/tầng/cấu trúc và dấu đánh dấu' },
  { id: 'TO3', group: 'TIME_OUT', short: 'Xác nhận kháng sinh dự phòng', label: 'TO3: Xác nhận kháng sinh dự phòng' },
  { id: 'TO4', group: 'TIME_OUT', short: 'Thông báo diễn biến, thời gian, dụng cụ, cấy ghép', label: 'TO4: Thông báo diễn biến bất thường, thời gian dự kiến, dụng cụ đặc biệt, vật tư cấy ghép' },
  { id: 'TO5', group: 'TIME_OUT', short: 'BS gây mê thông báo lưu ý gây mê/gây tê', label: 'TO5: Bác sĩ gây mê thông báo lưu ý đặc biệt về gây mê/gây tê/an thần' },
  { id: 'TO6', group: 'TIME_OUT', short: 'ĐD dụng cụ xác nhận vô khuẩn, thiết bị, CĐHA', label: 'TO6: Điều dưỡng dụng cụ xác nhận vô khuẩn, thiết bị đầy đủ, CĐHA hiển thị đúng' },
  { id: 'TO7', group: 'TIME_OUT', short: 'Ghi ngày giờ, hoàn thành bảng kiểm, ký xác nhận', label: 'TO7: Ghi ngày giờ hoàn thành bảng kiểm, ký xác nhận' },
  { id: 'TO8', group: 'TIME_OUT', short: 'Tuyên bố kết thúc tạm dừng, cho phép bắt đầu', label: 'TO8: Tuyên bố kết thúc tạm dừng an toàn, cho phép bắt đầu PT/TT' },

  // --- Sign-out: 5 tiêu chí ---
  { id: 'SO1', group: 'SIGN_OUT', short: 'Đọc to tên PT/TT đã thực hiện, khớp bảng kiểm', label: 'SO1: Đọc to tên PT/TT đã thực hiện, xác nhận khớp với bảng kiểm' },
  { id: 'SO2', group: 'SIGN_OUT', short: 'Hoàn thành đếm gạc, kim, dụng cụ', label: 'SO2: Hoàn thành đếm gạc, kim và dụng cụ phẫu thuật' },
  { id: 'SO3', group: 'SIGN_OUT', short: 'Đọc to nhãn bệnh phẩm, đủ thông tin', label: 'SO3: Đọc to nhãn bệnh phẩm, xác nhận đủ thông tin' },
  { id: 'SO4', group: 'SIGN_OUT', short: 'Thông báo vấn đề thiết bị, lưu ý hồi tỉnh', label: 'SO4: Thông báo vấn đề thiết bị/dụng cụ cần xử lý và lưu ý hồi tỉnh/chăm sóc sau PT/TT' },
  { id: 'SO5', group: 'SIGN_OUT', short: 'PTV trao đổi điểm tốt/cần cải tiến với ê-kíp', label: 'SO5: PTV trao đổi điểm thực hiện tốt/cần cải tiến, ghi nhận xét ê-kíp' }
];

/** Khoa/Khu vực thực hiện (danh mục mẫu theo BVQY103.QLCL.QĐ.04.V3) */
export const ATPT_KHU_VUC_OPTIONS = [
  'Phòng mổ',
  'Phòng thủ thuật',
  'Khoa Gây mê Hồi sức',
  'Khoa Hồi sức Tích cực',
  'Khoa Cấp cứu',
  'Phòng can thiệp tim mạch (Cath-lab)',
  'Chẩn đoán hình ảnh can thiệp',
  'Nội soi',
  'Khoa Răng Hàm Mặt',
  'Khoa Mắt',
  'Khoa Da liễu',
  'Khoa lâm sàng khác (chọc dò/sinh thiết/đặt catheter)'
];

/** Nhóm phẫu thuật/thủ thuật xâm lấn (Mục 2.1 Quy định) */
export const ATPT_NHOM_PTTT_OPTIONS = [
  'Phẫu thuật mở (Open surgical procedures)',
  'Nội soi ổ bụng (Laparoscopy)',
  'Nội soi (Endoscopy)',
  'Can thiệp/chẩn đoán tim và mạch máu qua da (Percutaneous cardiac & vascular)',
  'Can thiệp Chẩn đoán hình ảnh (Interventional Radiology)',
  'Thủ thuật nha khoa xâm lấn (Invasive dental procedures)',
  'Chọc hút qua da, sinh thiết (Percutaneous Aspiration)',
  'Đặt đường truyền trung tâm - ngoài phòng mổ (Central line insertions)',
  'Tiêm chọn lọc/Gây tê vùng - phong bế thần kinh (Selective nerve block)'
];

export interface AtptScore {
  /** Số tiêu chí trả lời "Có" */
  dat: number;
  /** Tổng tiêu chí áp dụng = Có + Không (loại trừ "Không áp dụng") */
  apDung: number;
  tyLe: number;
  /** Đạt chỉ khi KHÔNG có tiêu chí áp dụng nào bị đánh "Không" */
  ketQua: 'Đạt' | 'Không đạt';
}

/** Tính điểm từ bảng kiểm 23 tiêu chí */
export const scoreAtpt = (checklist?: Record<string, string>): AtptScore => {
  let dat = 0;
  let khong = 0;
  ATPT_CRITERIA.forEach(c => {
    const v = checklist?.[c.id];
    if (v === 'Có') dat += 1;
    else if (v === 'Không') khong += 1;
  });
  const apDung = dat + khong;
  return {
    dat,
    apDung,
    tyLe: apDung > 0 ? (dat / apDung) * 100 : 0,
    ketQua: khong === 0 && apDung > 0 ? 'Đạt' : 'Không đạt'
  };
};

/**
 * Cỡ mẫu tối thiểu theo JCI cho chỉ số quy trình:
 * N≥640 → 128; N=320-639 → 20%N; N=64-319 → 64; N<64 → 100%N
 */
export const jciMinSample = (n: number): number => {
  if (n >= 640) return 128;
  if (n >= 320) return Math.ceil(n * 0.2);
  if (n >= 64) return 64;
  return n;
};

export const JCI_SAMPLE_NOTE =
  'Ghi chú cỡ mẫu (theo hướng dẫn JCI): N≥640 → 128; N=320-639 → 20%N; N=64-319 → 64; N<64 → 100%N (lấy toàn bộ mẫu).';
