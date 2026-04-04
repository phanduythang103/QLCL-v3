import { supabase } from '../../supabaseClient';
import { fetchData83tc } from '../../readData83tc';
import { fetchDmDonVi } from '../../readDmDonVi';
import { 
  fetchAssessmentSheets, 
  fetchKqByPhieuId, 
  deletePhieuDanhGia, 
  saveKqDanhGia83Bulk 
} from '../../readKqDanhGia83';

export const assessmentService = {
  fetchCriteria: fetchData83tc,
  fetchUnits: fetchDmDonVi,
  fetchSheets: fetchAssessmentSheets,
  fetchResultsByPhieuId: fetchKqByPhieuId,
  deleteSheet: deletePhieuDanhGia,
  saveResultsBulk: saveKqDanhGia83Bulk,
  
  // Example of a local service function if needed
  getAllAssessmentResults: async () => {
    const { data, error } = await supabase
      .from('kq_danh_gia_cl_ks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  deleteStandard: async (id: number) => {
    const { error } = await supabase
      .from('kq_danh_gia_cl_ks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
