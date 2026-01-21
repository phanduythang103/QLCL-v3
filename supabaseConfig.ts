// Cấu hình Supabase
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log biến môi trường khi khởi tạo
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'OK' : 'MISSING');

// Thay thế <YOUR_SUPABASE_URL> và <YOUR_SUPABASE_ANON_KEY> bằng thông tin từ dự án Supabase của bạn.