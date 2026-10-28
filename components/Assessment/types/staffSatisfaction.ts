export interface StaffSatisfactionSurvey {
  id?: string;

  // Thông tin người điền phiếu (mẫu BYT - Mẫu số 3)
  gender?: 'nam' | 'nu' | null;     // A1
  age?: number | null;              // A2
  chuyen_mon?: string | null;       // A3. mã 1-5
  chuyen_mon_other?: string;
  bang_cap?: string | null;         // A4. mã 1-6
  bang_cap_other?: string;
  nam_nganh_y?: number | null;      // A5
  nam_tai_bv?: number | null;       // A6
  vi_tri?: string | null;           // A7. mã 1-6
  vi_tri_other?: string;
  pham_vi?: string | null;          // A8. mã 1-12
  pham_vi_other?: string;
  kiem_nhiem?: string | null;       // A9. mã 1-3
  so_lan_truc?: number | null;      // A10

  // Đánh giá theo mẫu BYT (thang 1-5), tên cột = mã câu
  a1?: number | null; a2?: number | null; a3?: number | null; a4?: number | null; a5?: number | null;
  a6?: number | null; a7?: number | null; a8?: number | null; a9?: number | null;
  b1?: number | null; b2?: number | null; b3?: number | null; b4?: number | null; b5?: number | null;
  b6?: number | null; b7?: number | null; b8?: number | null; b9?: number | null;
  c1?: number | null; c2?: number | null; c3?: number | null; c4?: number | null; c5?: number | null;
  c6?: number | null; c7?: number | null; c8?: number | null; c9?: number | null; c10?: number | null;
  c11?: number | null; c12?: number | null;
  d1?: number | null; d2?: number | null; d3?: number | null; d4?: number | null; d5?: number | null;
  d6?: number | null; d7?: number | null;
  e1?: number | null; e2?: number | null; e3?: number | null; e4?: number | null; e5?: number | null;
  e6?: number | null; e7?: number | null;

  suggestion?: string;              // G. Ý kiến, đề xuất khác

  // Mẫu cũ - giữ để xem lại phiếu đã thu
  block?: string;
  position?: string;
  years?: number;
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
  pressure?: string[];
  pressure_other?: string;
  financial_suggestion?: string;
  stay_intent?: string;

  ngay_khao_sat?: string;
}
