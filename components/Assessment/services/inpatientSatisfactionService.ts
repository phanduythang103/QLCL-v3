import { supabase } from '../../../supabaseClient';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';

export const inpatientSatisfactionService = {
  /**
   * Fetch all inpatient survey responses from 'ksnb_noi_tru' table.
   */
  async fetchInpatientSurveys(): Promise<InpatientSurveyResponse[]> {
    try {
      const { data, error } = await supabase
        .from('ksnb_noi_tru')
        .select('*')
        .order('ngay_khao_sat', { ascending: false });

      if (error) {
        console.error('Error fetching inpatient surveys:', error);
        throw new Error(`Không thể tải dữ liệu: ${error.message}`);
      }
      return data || [];
    } catch (err: any) {
      console.error('Inpatient service fetch error:', err);
      throw err;
    }
  },

  /**
   * Submit a new survey response.
   */
  async createInpatientSurvey(payload: InpatientSurveyResponse): Promise<InpatientSurveyResponse> {
    try {
      // Remove id and timestamps if they exist to let Supabase handle them
      const { id, created_at, ngay_khao_sat, ...insertData } = payload;
      
      const { data, error } = await supabase
        .from('ksnb_noi_tru')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating inpatient survey:', error);
        if (error.code === '42501') {
          throw new Error('Lỗi phân quyền: Bạn không có quyền thêm dữ liệu vào bảng này.');
        }
        throw new Error(`Lỗi gửi phiếu: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error('Inpatient service creation error:', err);
      throw err;
    }
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
