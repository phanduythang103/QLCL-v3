import { supabase } from './supabaseClient';

// Hàm lấy toàn bộ dữ liệu từ bảng users
export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  if (error) throw error;
  return data;
}
