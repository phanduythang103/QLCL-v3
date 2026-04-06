import { supabase } from '../../../supabaseClient';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';

export const staffSatisfactionService = {
  async fetchSurveys(): Promise<StaffSatisfactionSurvey[]> {
    try {
      const { data, error } = await supabase
        .from('staff_satisfaction_2026_responses')
        .select('*')
        .order('ngay_khao_sat', { ascending: false });

      if (error) {
        console.error('Error fetching staff surveys:', error);
        throw new Error(`Không thể tải dữ liệu: ${error.message}`);
      }
      return data || [];
    } catch (err: any) {
      console.error('Staff service fetch error:', err);
      throw err;
    }
  },

  async saveSurvey(survey: StaffSatisfactionSurvey): Promise<StaffSatisfactionSurvey> {
    try {
      // Remove id and timestamps if they exist to let Supabase handle them
      const { id, created_at, ngay_khao_sat, ...insertData } = survey as any;

      const { data, error } = await supabase
        .from('staff_satisfaction_2026_responses')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error saving staff survey:', error);
        if (error.code === '42501') {
          throw new Error('Lỗi phân quyền: Bạn không có quyền thêm dữ liệu vào bảng này.');
        }
        throw new Error(`Lỗi gửi phiếu: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error('Staff service creation error:', err);
      throw err;
    }
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
