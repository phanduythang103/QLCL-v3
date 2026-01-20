import { supabase } from './supabaseClient';

// Hàm đọc tất cả các bảng trong Supabase
export async function readAllTables(tableNames: string[]) {
  const results: Record<string, any> = {};
  for (const table of tableNames) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      results[table] = { error };
    } else {
      results[table] = data;
    }
  }
  return results;
}

// Ví dụ sử dụng:
// const tables = ['users', 'products', 'orders'];
// readAllTables(tables).then(console.log);