export interface KsNuoiConRecord {
  id?: string;
  created_at?: string;

  // Section: Thông tin hành chính
  hospital?: string;          // Tên bệnh viện
  survey_date?: string;       // Ngày khảo sát (ISO date string)
  department?: string;        // Tên khoa
  department_code?: string;   // Mã khoa
  patient_id?: string;        // Mã người bệnh

  // Section: Thông tin người bệnh
  age?: number;               // Tuổi
  phone?: string;             // Số điện thoại
  visit_count?: number;       // Lần nhập viện
  days_in_hospital?: number;  // Số ngày nằm viện
  birth_count?: number;       // Số lần sinh
  delivery_type?: number | null;     // Hình thức sinh: 1=Đẻ thường, 2=Mổ đẻ
  baby_birth_date?: string;   // Ngày sinh của trẻ (ISO date string)

  // Section: Thực hành nuôi con bằng sữa mẹ
  // Checkbox fields stored as integer arrays
  see_policy?: number[];          // Thấy quy định NCBSM (1-6)
  see_media?: number[];           // Thấy tài liệu truyền thông (1-7)
  consultation_time?: number[];   // Được tư vấn khi nào (1-5)
  reason_no_consult?: number | null;     // Lý do không được tư vấn (1-5)
  cord_cut?: number | null;              // Cắt dây rốn (1-3)
  skin_to_skin?: number | null;          // Da kề da (1-2)
  first_breastfeed?: number | null;      // Thời điểm bú đầu tiên (1-8)
  support_person?: number[];      // Ai hỗ trợ bú (1-5)
  support_type?: number[];        // Hình thức hỗ trợ (1-5)
  other_food?: number | null;            // Cho ăn thêm (1-5)
  suggest_formula?: number | null;       // Gợi ý sữa công thức (1-2)
  benefits?: string;              // Lợi ích sữa mẹ (textarea)
  exclusive_months?: number | null;      // Bú hoàn toàn (tháng)
  total_months?: number | null;          // Tổng thời gian bú (tháng)
  suggestions?: string;           // Kiến nghị (textarea)
}
