export interface KsMeSinhConRecord {
  id?: string;
  created_at?: string;

  // Section: Thông tin hành chính
  hospital?: string;          // Tên bệnh viện
  survey_date?: string;       // Ngày điền phiếu
  departments?: string;       // Các khoa đã điều trị
  department_code?: string;   // Mã khoa
  mother_id?: string;         // Mã số người mẹ

  // Section: Thông tin người bệnh
  age?: number;               // Tuổi
  phone?: string;             // Số điện thoại
  days_in_hospital?: number;  // Số ngày nằm viện
  visit_count?: number;       // Lần nhập viện
  bhyt?: number;              // Sử dụng BHYT: 1=Có, 2=Không
  birth_method?: number;      // Cách sinh: 1=Đẻ thường, 2=Mổ cấp cứu, 3=Mổ có chuẩn bị, 4=Khác
  birth_method_other?: string;
  prenatal_check?: number;    // Khám thai: 1=Có khám, 2=Chỉ đến sinh, 3=Không nhớ
  prenatal_check_other?: string;

  // Section: Đánh giá dịch vụ (Matrix 1-5)
  // Khả năng tiếp cận
  ea1?: number | null;
  ea2?: number | null;
  // Quy trình khám
  eb1?: number | null;
  eb2?: number | null;
  // Tư vấn
  ec1?: number | null;
  ec2?: number | null;
  ec3?: number | null;
  // Cơ sở vật chất
  ed1?: number | null;
  ed2?: number | null;
  ed3?: number | null;
  ed4?: number | null;
  ed5?: number | null;
  ed6?: number | null;
  // Thái độ nhân viên
  ee1?: number | null;
  ee2?: number | null;
  ee3?: number | null;
  ee4?: number | null;
  // Chuyên môn
  eg1?: number | null;
  eg2?: number | null;
  eg3?: number | null;
  // Kết quả
  eh1?: number | null;
  eh2?: number | null;
  eh3?: number | null;

  // Section: Đánh giá chung
  overall_satisfaction?: number | null; // Mức hài lòng chung (1-5)
  satisfaction_percent?: number | null; // Mức đáp ứng (%)
  return_intent?: number | null;        // Quay lại bệnh viện (1-6)
  return_intent_other?: string;
  note?: string;                 // Ý kiến thêm
}
