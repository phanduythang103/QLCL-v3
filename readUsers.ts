import { supabase } from './supabaseClient';

// Hàm lấy toàn bộ dữ liệu từ bảng users
export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  if (error) throw error;
  return data;
}

// Thêm người dùng mới
export async function addUser(user) {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Sửa thông tin người dùng
export async function updateUser(id, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

// Xóa người dùng
export async function deleteUser(id) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
