import { supabase } from './supabaseClient';
import { JCIFallIncident, JCIFallPatientDays, JCICriticalResult, JCIHandoverIncident, JCIHandoverVisits } from './types';

// ==========================================
// 1. FALL INCIDENTS (AOP.02.00)
// ==========================================
export const fetchFallIncidents = async (): Promise<JCIFallIncident[]> => {
  const { data, error } = await supabase
    .from('jci_fall_incidents')
    .select('*')
    .order('thoi_gian_nga', { ascending: false });

  if (error) {
    console.error('Error fetching fall incidents:', error);
    return [];
  }
  return data || [];
};

export const addFallIncident = async (incident: Omit<JCIFallIncident, 'id' | 'created_at'>): Promise<JCIFallIncident | null> => {
  const { data, error } = await supabase
    .from('jci_fall_incidents')
    .insert([incident])
    .select()
    .single();

  if (error) {
    console.error('Error adding fall incident:', error);
    throw error;
  }
  return data;
};

export const updateFallIncident = async (id: string, incident: Partial<JCIFallIncident>): Promise<JCIFallIncident | null> => {
  const { data, error } = await supabase
    .from('jci_fall_incidents')
    .update({ ...incident, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating fall incident:', error);
    throw error;
  }
  return data;
};

export const deleteFallIncident = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('jci_fall_incidents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting fall incident:', error);
    throw error;
  }
  return true;
};


// ==========================================
// 2. CRITICAL RESULTS (IPSG.02.00)
// ==========================================
export const fetchCriticalResults = async (): Promise<JCICriticalResult[]> => {
  const { data, error } = await supabase
    .from('jci_critical_results')
    .select('*')
    .order('thoi_gian_co_kq', { ascending: false });

  if (error) {
    console.error('Error fetching critical results:', error);
    return [];
  }
  return data || [];
};

export const addCriticalResult = async (result: Omit<JCICriticalResult, 'id' | 'created_at'>): Promise<JCICriticalResult | null> => {
  const { data, error } = await supabase
    .from('jci_critical_results')
    .insert([result])
    .select()
    .single();

  if (error) {
    console.error('Error adding critical result:', error);
    throw error;
  }
  return data;
};

export const updateCriticalResult = async (id: string, result: Partial<JCICriticalResult>): Promise<JCICriticalResult | null> => {
  const { data, error } = await supabase
    .from('jci_critical_results')
    .update({ ...result, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating critical result:', error);
    throw error;
  }
  return data;
};

export const deleteCriticalResult = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('jci_critical_results')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting critical result:', error);
    throw error;
  }
  return true;
};


// ==========================================
// 3. HANDOVER INCIDENTS (IPSG.02.01)
// ==========================================
export const fetchHandoverIncidents = async (): Promise<JCIHandoverIncident[]> => {
  const { data, error } = await supabase
    .from('jci_handover_incidents')
    .select('*')
    .order('thoi_gian_su_co', { ascending: false });

  if (error) {
    console.error('Error fetching handover incidents:', error);
    return [];
  }
  return data || [];
};

export const addHandoverIncident = async (incident: Omit<JCIHandoverIncident, 'id' | 'created_at'>): Promise<JCIHandoverIncident | null> => {
  const { data, error } = await supabase
    .from('jci_handover_incidents')
    .insert([incident])
    .select()
    .single();

  if (error) {
    console.error('Error adding handover incident:', error);
    throw error;
  }
  return data;
};

export const updateHandoverIncident = async (id: string, incident: Partial<JCIHandoverIncident>): Promise<JCIHandoverIncident | null> => {
  const { data, error } = await supabase
    .from('jci_handover_incidents')
    .update({ ...incident, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating handover incident:', error);
    throw error;
  }
  return data;
};

export const deleteHandoverIncident = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('jci_handover_incidents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting handover incident:', error);
    throw error;
  }
  return true;
};

// ==========================================
// 1b. MẪU SỐ AOP.02.00 - TỔNG SỐ NGÀY NẰM VIỆN THEO THÁNG
// ==========================================
export const fetchFallPatientDays = async (nam: number): Promise<JCIFallPatientDays[]> => {
  const { data, error } = await supabase
    .from('jci_fall_patient_days')
    .select('*')
    .eq('nam', nam)
    .order('thang', { ascending: true });

  if (error) {
    console.error('Error fetching fall patient days:', error);
    return [];
  }
  return data || [];
};

/** Ghi đè số ngày nằm viện của 1 tháng (khoá duy nhất theo nam + thang) */
export const upsertFallPatientDays = async (
  nam: number,
  thang: number,
  so_ngay_nam_vien: number
): Promise<JCIFallPatientDays | null> => {
  const { data, error } = await supabase
    .from('jci_fall_patient_days')
    .upsert(
      { nam, thang, so_ngay_nam_vien, updated_at: new Date().toISOString() },
      { onConflict: 'nam,thang' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving fall patient days:', error);
    throw error;
  }
  return data;
};

// ==========================================
// 3b. MẪU SỐ IPSG.02.01 - TỔNG LƯỢT KHÁM, ĐIỀU TRỊ THEO THÁNG
// ==========================================
export const fetchHandoverVisits = async (nam: number): Promise<JCIHandoverVisits[]> => {
  const { data, error } = await supabase
    .from('jci_handover_visits')
    .select('*')
    .eq('nam', nam)
    .order('thang', { ascending: true });

  if (error) {
    console.error('Error fetching handover visits:', error);
    return [];
  }
  return data || [];
};

/** Ghi đè tổng lượt khám của 1 tháng (khoá duy nhất theo nam + thang) */
export const upsertHandoverVisits = async (
  nam: number,
  thang: number,
  so_luot_kham: number
): Promise<JCIHandoverVisits | null> => {
  const { data, error } = await supabase
    .from('jci_handover_visits')
    .upsert(
      { nam, thang, so_luot_kham, updated_at: new Date().toISOString() },
      { onConflict: 'nam,thang' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving handover visits:', error);
    throw error;
  }
  return data;
};
