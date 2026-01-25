import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Validation: Cảnh báo nếu thiếu cấu hình nhưng không crash ứng dụng ngay lập tức
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null as any; 
