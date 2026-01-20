// Cấu hình Supabase
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Thay thế <YOUR_SUPABASE_URL> và <YOUR_SUPABASE_ANON_KEY> bằng thông tin từ dự án Supabase của bạn.