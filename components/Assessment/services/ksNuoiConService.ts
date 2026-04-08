import { supabase } from '../../../supabaseClient';
import { KsNuoiConRecord } from '../types/ksNuoiCon';

export const ksNuoiConService = {
  /** Fetch all records */
  async fetchAll(): Promise<KsNuoiConRecord[]> {
    const { data, error } = await supabase
      .from('ks_nuoi_con')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching ks_nuoi_con:', error);
      throw error;
    }
    return data || [];
  },

  /** Create a new record */
  async create(payload: KsNuoiConRecord): Promise<KsNuoiConRecord> {
    // Remove id/created_at if present – let DB generate them
    const { id, created_at, ...insertData } = payload as any;
    const { data, error } = await supabase
      .from('ks_nuoi_con')
      .insert([insertData])
      .select()
      .single();
    if (error) {
      console.error('Error creating ks_nuoi_con:', error);
      throw error;
    }
    return data;
  },

  /** Update an existing record */
  async update(id: string, payload: Partial<KsNuoiConRecord>): Promise<KsNuoiConRecord> {
    const { data, error } = await supabase
      .from('ks_nuoi_con')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Delete a record */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('ks_nuoi_con').delete().eq('id', id);
    if (error) throw error;
  },
};
