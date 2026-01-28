import { supabase } from './supabaseClient';

export interface ChiaSe {
  id?: string;
  tieu_de: string;
  noi_dung: string;
  phan_loai?: string;
  hinh_anh?: string;
  video?: string;
  file_tai_lieu?: string;
  luot_thich?: number;
  ngay_dang?: string;
  nguoi_dang: string;
  created_at?: string;
}

export async function fetchChiaSe(): Promise<ChiaSe[]> {
  const { data, error } = await supabase
    .from('chia_se')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addChiaSe(record: Omit<ChiaSe, 'id'>): Promise<ChiaSe> {
  const { data, error } = await supabase
    .from('chia_se')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateChiaSe(id: string, updates: Partial<ChiaSe>): Promise<ChiaSe> {
  const { data, error } = await supabase
    .from('chia_se')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteChiaSe(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('chia_se')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// --- Social Features ---

// Comments
export async function fetchComments(articleId: string) {
  const { data, error } = await supabase
    .from('chia_se_comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(articleId: string, userId: string, fullName: string, content: string) {
  const { data, error } = await supabase
    .from('chia_se_comments')
    .insert([{ article_id: articleId, user_id: userId, user_full_name: fullName, content }])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Reactions
export async function fetchReactions(articleId: string) {
  const { data, error } = await supabase
    .from('chia_se_reactions')
    .select('*')
    .eq('article_id', articleId);
  if (error) throw error;
  return data || [];
}

export async function toggleReaction(articleId: string, userId: string, type: 'like' | 'dislike' | null) {
  if (type === null) {
    const { error } = await supabase
      .from('chia_se_reactions')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', userId);
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from('chia_se_reactions')
    .upsert({ article_id: articleId, user_id: userId, type }, { onConflict: 'article_id,user_id' })
    .select();
  if (error) throw error;
  return data?.[0];
}

// Bookmarks
export async function fetchBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('chia_se_bookmarks')
    .select('article_id')
    .eq('user_id', userId);
  if (error) throw error;
  return data?.map((d: { article_id: string }) => d.article_id) || [];
}

export async function toggleBookmark(articleId: string, userId: string, isBookmarked: boolean) {
  if (!isBookmarked) {
    const { error } = await supabase
      .from('chia_se_bookmarks')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', userId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('chia_se_bookmarks')
      .insert([{ article_id: articleId, user_id: userId }]);
    if (error) throw error;
    return true;
  }
}
