export interface OutpatientSurveyResponse {
  id?: string;
  // General information
  full_name?: string;
  phone?: string;              // A3. Số di động
  gender?: 'nam' | 'nu' | null; // A1
  age?: number | null;          // A2
  distance_km?: number | null;  // A4. Khoảng cách từ nơi sinh sống đến bệnh viện
  has_bhyt?: boolean | null;    // A5
  area?: string;               // Mẫu cũ: kham_dan, kham_quan, bhyt, yeu_cau, pk232
  visit_time?: string;        // Mẫu cũ
  respondent?: string;        // Mẫu cũ: patient or relative

  // Đánh giá theo mẫu BYT (thang 1-5), tên cột = mã câu
  a1?: number | null; a2?: number | null; a3?: number | null; a4?: number | null; a5?: number | null;
  b1?: number | null; b2?: number | null; b3?: number | null; b4?: number | null; b5?: number | null;
  b6?: number | null; b7?: number | null; b8?: number | null; b9?: number | null; b10?: number | null;
  c1?: number | null; c2?: number | null; c3?: number | null; c4?: number | null;
  c5?: number | null; c6?: number | null; c7?: number | null; c8?: number | null;
  d1?: number | null; d2?: number | null; d3?: number | null; d4?: number | null;
  e1?: number | null; e2?: number | null; e3?: number | null; e4?: number | null;

  // Mẫu cũ (q1-q15) – 0 = not applicable, 1-5 scale
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
  q13?: number | null;
  q14?: number | null;
  q15?: number | null;

  // Đánh giá chung
  satisfaction_percent?: number | null; // F. % đáp ứng mong đợi
  return_intent?: string;               // G. mã 1-5
  return_intent_other?: string;         // G. Khác (ghi rõ)

  // Mẫu cũ - root cause analysis
  waiting_issues?: string[]; // Stored as JSONB in SQL (array of selected options)
  priority_improvement?: string[]; // Stored as JSONB in SQL (array of selected options)
  priority_improvement_other?: string;
  feedback?: string;

  // Metadata
  ngay_khao_sat?: string;
  created_at?: string;
}
