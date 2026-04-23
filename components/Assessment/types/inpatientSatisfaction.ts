export interface InpatientSurveyResponse {
  id?: string;
  full_name: string;
  phone?: string;
  department: string;
  hospital_days: number;
  respondent: 'patient' | 'relative';

  // Service evaluation (Q1 - Q12)
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  q5: number | null;
  q6: number | null;
  q7: number | null;
  q8: number | null;
  q9: number | null;
  q10: number | null;
  q11: number | null;
  q12: number | null;

  // Overall evaluation
  satisfaction_percent: number;
  return_intent: 'no' | 'maybe' | 'yes';
  feedback: string;

  // Metadata
  ngay_khao_sat?: string;
  created_at?: string;
}
