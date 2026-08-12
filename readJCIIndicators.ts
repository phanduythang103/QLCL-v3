import { supabase } from './supabaseClient';
import { JCIFallIncident, JCICriticalResult, JCIHandoverIncident } from './types';

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
