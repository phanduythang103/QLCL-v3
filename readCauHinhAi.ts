import { supabase } from './supabaseClient';

export interface AiConfig {
  id: string;
  created_at: string;
  provider: string;
  model_name: string;
  api_key: string;
  is_active: boolean;
  description?: string;
}

export interface PromptConfig {
  id: string;
  created_at: string;
  module_key: string;
  prompt_name: string;
  prompt_text: string;
  is_active: boolean;
}

// --- AI Config ---
export const fetchAiConfigs = async (): Promise<AiConfig[]> => {
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_ai')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const addAiConfig = async (config: Omit<AiConfig, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_ai')
    .insert([config])
    .select();
  if (error) throw error;
  return data?.[0];
};

export const updateAiConfig = async (id: string, config: Partial<AiConfig>) => {
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_ai')
    .update(config)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
};

export const deleteAiConfig = async (id: string) => {
  const { error } = await supabase
    .from('he_thong_cau_hinh_ai')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const setActiveAiConfig = async (id: string) => {
  // First, deactivate all
  await supabase.from('he_thong_cau_hinh_ai').update({ is_active: false }).neq('id', id);
  // Then activate the current
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_ai')
    .update({ is_active: true })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
};

// --- Prompt Config ---
export const fetchPromptConfigs = async (): Promise<PromptConfig[]> => {
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_prompt')
    .select('*')
    .order('module_key');
  if (error) throw error;
  return data || [];
};

export const upsertPromptConfig = async (config: Omit<PromptConfig, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_prompt')
    .upsert([config], { onConflict: 'module_key' })
    .select();
  if (error) throw error;
  return data?.[0];
};

export const getActivePrompt = async (moduleKey: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('he_thong_cau_hinh_prompt')
    .select('prompt_text')
    .eq('module_key', moduleKey)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data?.prompt_text || null;
};
