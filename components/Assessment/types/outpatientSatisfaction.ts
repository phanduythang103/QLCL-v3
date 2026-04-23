export interface OutpatientSurveyResponse {
  id?: string;
  // General information
  full_name?: string;
  phone?: string;
  area?: string;               // e.g., kham_dan, kham_quan, bhyt, yeu_cau, pk232
  visit_time?: string;        // Full ISO timestamp (date + shift info can be embedded or handled)
  respondent?: string;        // patient or relative

  // Rating questions (q1-q15) – 0 = not applicable, 1-5 scale
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

  // Root cause analysis
  waiting_issues?: string[]; // Stored as JSONB in SQL (array of selected options)
  priority_improvement?: string[]; // Stored as JSONB in SQL (array of selected options)
  priority_improvement_other?: string;
  feedback?: string;

  // Metadata
  ngay_khao_sat?: string;
  created_at?: string;
}

