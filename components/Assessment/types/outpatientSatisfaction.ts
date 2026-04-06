export interface OutpatientSurveyResponse {
  id?: string;
  // General information
  full_name?: string;
  phone?: string;
  area?: string;               // e.g., kham_dan, kham_quan, bhyt, yeu_cau, pk232
  visit_time?: string;        // Full ISO timestamp (date + shift info can be embedded or handled)
  respondent?: string;        // patient or relative
  
  // Rating questions (q1-q15) – 0 = not applicable, 1-5 scale
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  q5?: number;
  q6?: number;
  q7?: number;
  q8?: number;
  q9?: number;
  q10?: number;
  q11?: number;
  q12?: number;
  q13?: number;
  q14?: number;
  q15?: number;
  
  // Root cause analysis
  waiting_issues?: string[]; // Stored as JSONB in SQL (array of selected options)
  priority_improvement?: string[]; // Stored as JSONB in SQL (array of selected options)
  priority_improvement_other?: string;
  feedback?: string;
  
  // Metadata
  ngay_khao_sat?: string;
  created_at?: string;
}

