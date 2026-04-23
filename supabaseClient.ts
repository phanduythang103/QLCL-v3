import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Custom storage to handle cases where localStorage is blocked (e.g., Zalo Android in-app)
const safeStorage = {
    getItem: (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return (window as any).__MEM_STORAGE?.[key] || null;
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            if (!(window as any).__MEM_STORAGE) (window as any).__MEM_STORAGE = {};
            (window as any).__MEM_STORAGE[key] = value;
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            if ((window as any).__MEM_STORAGE) delete (window as any).__MEM_STORAGE[key];
        }
    }
};

// Validation: Cảnh báo nếu thiếu cấu hình
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration.');
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: safeStorage,
            persistSession: true,
            autoRefreshToken: true
        }
    })
    : null as any;
