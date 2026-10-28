import { supabase } from '../../../supabaseClient';
import { IsoSurveyResponse } from '../types/isoSatisfaction';

const TABLE = 'ks_hai_long_iso';

export const isoSatisfactionService = {
  /**
   * Fetch all ISO satisfaction survey responses.
   */
  async fetchSurveys(): Promise<IsoSurveyResponse[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('ngay_khao_sat', { ascending: false });

    if (error) {
      console.error('Error fetching ISO surveys:', error);
      throw new Error(`Không thể tải dữ liệu: ${error.message}`);
    }
    return data || [];
  },

  /**
   * Submit a new survey response.
   */
  async createSurvey(payload: IsoSurveyResponse): Promise<IsoSurveyResponse> {
    const { id, created_at, ngay_khao_sat, ...insertData } = payload;

    const { data, error } = await supabase
      .from(TABLE)
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating ISO survey:', error);
      if (error.code === '42501') {
        throw new Error('Lỗi phân quyền: Bạn không có quyền thêm dữ liệu vào bảng này.');
      }
      throw new Error(`Lỗi gửi phiếu: ${error.message}`);
    }
    return data;
  },

  /**
   * Update an existing survey response.
   */
  async updateSurvey(id: string, payload: Partial<IsoSurveyResponse>): Promise<IsoSurveyResponse> {
    const { id: _id, created_at, ...updateData } = payload as IsoSurveyResponse;
    const { data, error } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a survey response.
   */
  async deleteSurvey(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
