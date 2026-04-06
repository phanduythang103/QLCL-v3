export interface StaffSatisfactionSurvey {
  id?: string;
  block: string;
  position: string;
  years: number;
  
  // Matrix questions Q1-Q13
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
  q13: number;

  pressure: string[];
  pressure_other?: string;
  financial_suggestion?: string;
  stay_intent: string;
  suggestion?: string;
  
  ngay_khao_sat?: string;
}
