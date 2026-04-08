import { supabase } from '../../../supabaseClient';
import { KsMeSinhConRecord } from '../types/ksMeSinhCon';

export const ksMeSinhConService = {
  /** Fetch all records */
  async fetchAll(): Promise<KsMeSinhConRecord[]> {
    const { data, error } = await supabase
      .from('ks_me_sinh_con')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching ks_me_sinh_con:', error);
      throw error;
    }
    return data || [];
  },

  /** Create a new record */
  async create(payload: KsMeSinhConRecord): Promise<KsMeSinhConRecord> {
    const { id, created_at, ...insertData } = payload as any;
    const { data, error } = await supabase
      .from('ks_me_sinh_con')
      .insert([insertData])
      .select()
      .single();
    if (error) {
      console.error('Error creating ks_me_sinh_con:', error);
      throw error;
    }
    return data;
  },

  /** Update an existing record */
  async update(id: string, payload: Partial<KsMeSinhConRecord>): Promise<KsMeSinhConRecord> {
    const { data, error } = await supabase
      .from('ks_me_sinh_con')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Delete a record */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('ks_me_sinh_con').delete().eq('id', id);
    if (error) throw error;
  },
};
