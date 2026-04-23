export interface StaffSatisfactionSurvey {
  id?: string;
  block: string;
  position: string;
  years: number;

  // Matrix questions Q1-Q13
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
  q13: number | null;

  pressure: string[];
  pressure_other?: string;
  financial_suggestion?: string;
  stay_intent: string;
  suggestion?: string;

  ngay_khao_sat?: string;
}
