import { supabase } from '../../../supabaseClient';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';

export const outpatientSatisfactionService = {
  /**
   * Fetch all outpatient survey responses from 'ksnb_ngoai_tru' table.
   */
  async fetchOutpatientSurveys(): Promise<OutpatientSurveyResponse[]> {
    try {
      const { data, error } = await supabase
        .from('ksnb_ngoai_tru')
        .select('*')
        .order('ngay_khao_sat', { ascending: false });

      if (error) {
        console.error('Error fetching outpatient surveys:', error);
        throw new Error(`Không thể tải dữ liệu: ${error.message}`);
      }
      return data || [];
    } catch (err: any) {
      console.error('Outpatient service fetch error:', err);
      throw err;
    }
  },

  /**
   * Submit a new outpatient survey response.
   */
  async createOutpatientSurvey(payload: OutpatientSurveyResponse): Promise<OutpatientSurveyResponse> {
    try {
      // Remove id and timestamps if they exist to let Supabase handle them
      const { id, created_at, ngay_khao_sat, ...insertData } = payload;

      const { data, error } = await supabase
        .from('ksnb_ngoai_tru')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating outpatient survey:', error);
        if (error.code === '42501') {
          throw new Error('Lỗi phân quyền: Bạn không có quyền thêm dữ liệu vào bảng này.');
        }
        throw new Error(`Lỗi gửi phiếu: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error('Outpatient service creation error:', err);
      throw err;
    }
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
