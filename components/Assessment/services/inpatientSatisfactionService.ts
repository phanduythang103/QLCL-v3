import { supabase } from '../../../supabaseClient';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';

export const inpatientSatisfactionService = {
  /**
   * Fetch all inpatient survey responses from 'ksnb_noi_tru' table.
   */
  async fetchInpatientSurveys(): Promise<InpatientSurveyResponse[]> {
    const { data, error } = await supabase
      .from('ksnb_noi_tru')
      .select('*')
      .order('ngay_khao_sat', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Submit a new survey response.
   */
  async createInpatientSurvey(payload: InpatientSurveyResponse): Promise<InpatientSurveyResponse> {
    const { data, error } = await supabase
      .from('ksnb_noi_tru')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing survey response.
   */
  async updateInpatientSurvey(id: string, payload: Partial<InpatientSurveyResponse>): Promise<InpatientSurveyResponse> {
    const { data, error } = await supabase
      .from('ksnb_noi_tru')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a survey response.
   */
  async deleteInpatientSurvey(id: string): Promise<void> {
    const { error } = await supabase
      .from('ksnb_noi_tru')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
