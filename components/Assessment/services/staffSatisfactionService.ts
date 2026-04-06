import { supabase } from '../../../supabaseClient';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';

export const staffSatisfactionService = {
  async fetchSurveys(): Promise<StaffSatisfactionSurvey[]> {
    const { data, error } = await supabase
      .from('staff_satisfaction_2026_responses')
      .select('*')
      .order('ngay_khao_sat', { ascending: false });

    if (error) {
      console.error('Error fetching surveys:', error);
      throw error;
    }

    return data || [];
  },

  async saveSurvey(survey: StaffSatisfactionSurvey): Promise<StaffSatisfactionSurvey> {
    const { data, error } = await supabase
      .from('staff_satisfaction_2026_responses')
      .insert([survey])
      .select()
      .single();

    if (error) {
      console.error('Error saving survey:', error);
      throw error;
    }

    return data;
  },

  async updateSurvey(id: string, survey: StaffSatisfactionSurvey): Promise<StaffSatisfactionSurvey> {
    const { data, error } = await supabase
      .from('staff_satisfaction_2026_responses')
      .update(survey)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating survey:', error);
      throw error;
    }

    return data;
  },

  async deleteSurvey(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_satisfaction_2026_responses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }
  }
};
