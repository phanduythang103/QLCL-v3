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
  ea1?: number;
  ea2?: number;
  // Quy trình khám
  eb1?: number;
  eb2?: number;
  // Tư vấn
  ec1?: number;
  ec2?: number;
  ec3?: number;
  // Cơ sở vật chất
  ed1?: number;
  ed2?: number;
  ed3?: number;
  ed4?: number;
  ed5?: number;
  ed6?: number;
  // Thái độ nhân viên
  ee1?: number;
  ee2?: number;
  ee3?: number;
  ee4?: number;
  // Chuyên môn
  eg1?: number;
  eg2?: number;
  eg3?: number;
  // Kết quả
  eh1?: number;
  eh2?: number;
  eh3?: number;

  // Section: Đánh giá chung
  satisfaction_percent?: number; // Mức đáp ứng (%)
  return_intent?: number;        // Quay lại bệnh viện (1-6)
  return_intent_other?: string;
  note?: string;                 // Ý kiến thêm
}
