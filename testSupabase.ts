import { supabase } from './supabaseClient';

// Hàm kiểm tra kết nối và lưu dữ liệu mẫu lên Supabase
export async function testSupabaseConnection() {
  // Thay 'test_table' bằng tên bảng thực tế của bạn
  const { data, error } = await supabase.from('test_table').insert([
    { name: 'Test', created_at: new Date().toISOString() }
  ]);
  if (error) {
    console.error('Supabase error:', error);
    return false;
  }
  console.log('Supabase insert success:', data);
  return true;
}
