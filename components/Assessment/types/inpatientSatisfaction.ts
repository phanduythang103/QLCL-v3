export interface InpatientSurveyResponse {
  id?: string;
  full_name?: string;          // Mẫu cũ (mẫu BYT không thu họ tên)
  phone?: string;              // A3. Số di động
  department: string;          // 4-5. Khoa nằm điều trị trước ra viện (mã - tên khoa)
  hospital_days: number;       // A4. Tổng số ngày nằm viện
  respondent: 'patient' | 'relative'; // 3. Người trả lời
  gender?: 'nam' | 'nu' | null;       // A1
  age?: number | null;                // A2
  has_bhyt?: boolean | null;          // A5

  // Đánh giá theo mẫu BYT (thang 1-5), tên cột = mã câu
  a1?: number | null; a2?: number | null; a3?: number | null; a4?: number | null; a5?: number | null;
  b1?: number | null; b2?: number | null; b3?: number | null; b4?: number | null; b5?: number | null;
  c1?: number | null; c2?: number | null; c3?: number | null; c4?: number | null; c5?: number | null;
  c6?: number | null; c7?: number | null; c8?: number | null; c9?: number | null;
  d1?: number | null; d2?: number | null; d3?: number | null; d4?: number | null; d5?: number | null;
  d6?: number | null; d7?: number | null;
  e1?: number | null; e2?: number | null; e3?: number | null; e4?: number | null; e5?: number | null;

  // Mẫu cũ (Q1 - Q12) - giữ để xem lại phiếu đã thu
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
  q5?: number | null;
  q6?: number | null;
  q7?: number | null;
  q8?: number | null;
  q9?: number | null;
  q10?: number | null;
  q11?: number | null;
  q12?: number | null;

  // Đánh giá chung
  satisfaction_percent: number;   // G1. % đáp ứng mong đợi
  return_intent: string;          // G2. mã 1-6 (mẫu cũ: no | maybe | yes)
  return_intent_other?: string;   // G2. Khác (ghi rõ)
  feedback: string;               // H. Ý kiến khác

  // Metadata
  ngay_khao_sat?: string;
  created_at?: string;
}
