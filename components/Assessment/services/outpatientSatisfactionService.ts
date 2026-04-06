import { supabase } from '../../../supabaseClient';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';

export const outpatientSatisfactionService = {
  /**
   * Fetch all outpatient survey responses from 'ksnb_ngoai_tru' table.
   */
  async fetchOutpatientSurveys(): Promise<OutpatientSurveyResponse[]> {
    const { data, error } = await supabase
      .from('ksnb_ngoai_tru')
      .select('*')
      .order('ngay_khao_sat', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * Submit a new outpatient survey response.
   */
  async createOutpatientSurvey(payload: OutpatientSurveyResponse): Promise<OutpatientSurveyResponse> {
    const { data, error } = await supabase
      .from('ksnb_ngoai_tru')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Update an existing outpatient survey response.
   */
  async updateOutpatientSurvey(id: string, payload: Partial<OutpatientSurveyResponse>): Promise<OutpatientSurveyResponse> {
    const { data, error } = await supabase
      .from('ksnb_ngoai_tru')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Delete an outpatient survey response.
   */
  async deleteOutpatientSurvey(id: string): Promise<void> {
    const { error } = await supabase
      .from('ksnb_ngoai_tru')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
