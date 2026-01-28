// Re-export từ userApi để tránh duplicate code
import { supabase } from './supabaseClient';
import { invalidateCache, CACHE_KEYS } from './utils/cache';
export { fetchUsers } from './userApi';
import type { Personnel } from './types';

// Tối ưu: Chỉ select các trường cần thiết
const USER_SELECT_FIELDS = 'id, username, full_name, role, department, status, avatar, created_at';

// Thêm người dùng mới
export async function addUser(user: Omit<Personnel, 'id'>): Promise<Personnel> {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select(USER_SELECT_FIELDS);
  if (error) throw error;
  invalidateCache(CACHE_KEYS.USERS);
  return data?.[0];
}

// Sửa thông tin người dùng
export async function updateUser(id: string, updates: Partial<Personnel>): Promise<Personnel> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select(USER_SELECT_FIELDS);
  if (error) throw error;
  invalidateCache(CACHE_KEYS.USERS);
  return data?.[0];
}

// Xóa người dùng
export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) throw error;
  invalidateCache(CACHE_KEYS.USERS);
  return true;
}
