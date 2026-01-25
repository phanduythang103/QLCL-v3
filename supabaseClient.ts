import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Validation: Đảm bảo có giá trị trước khi tạo client
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
