export interface InpatientSurveyResponse {
  id?: string;
  full_name: string;
  phone?: string;
  department: string;
  hospital_days: number;
  respondent: 'patient' | 'relative';
  
  // Service evaluation (Q1 - Q12)
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  q11: number;
  q12: number;
  
  // Overall evaluation
  satisfaction_percent: number;
  return_intent: 'no' | 'maybe' | 'yes';
  feedback: string;
  
  // Metadata
  ngay_khao_sat?: string;
  created_at?: string;
}
