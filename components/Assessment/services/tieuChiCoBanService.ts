import { supabase } from '../../../supabaseClient';
import { TieuChiCoBan } from '../types/tieuChiCoBan';

export const tieuChiCoBanService = {
  fetchAssessments: async () => {
    const { data, error } = await supabase
      .from('danh_gia_tieu_chi_co_ban')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as TieuChiCoBan[];
  },

  saveAssessment: async (payload: TieuChiCoBan) => {
    const { data, error } = await supabase
      .from('danh_gia_tieu_chi_co_ban')
      .insert([payload])
      .select();
    if (error) throw error;
    return data[0] as TieuChiCoBan;
  },

  updateAssessment: async (id: string, payload: Partial<TieuChiCoBan>) => {
    const { data, error } = await supabase
      .from('danh_gia_tieu_chi_co_ban')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0] as TieuChiCoBan;
  },

  deleteAssessment: async (id: string) => {
    const { error } = await supabase
      .from('danh_gia_tieu_chi_co_ban')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
