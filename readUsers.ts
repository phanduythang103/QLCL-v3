import { supabase } from './supabaseClient';
import type { Personnel } from './types';

// Hàm lấy toàn bộ dữ liệu từ bảng users
export async function fetchUsers(): Promise<Personnel[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  if (error) throw error;
  return data || [];
}

// Thêm người dùng mới
export async function addUser(user: Omit<Personnel, 'id'>): Promise<Personnel> {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Sửa thông tin người dùng
export async function updateUser(id: string, updates: Partial<Personnel>): Promise<Personnel> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

// Xóa người dùng
export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
