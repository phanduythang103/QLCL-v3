// Runtime configuration for Supabase
// Vite replaces import.meta.env at BUILD time, not runtime
// So we need to access it directly and handle undefined case

const getEnvVar = (key: string): string => {
    // In production build, Vite will replace this with the actual value
    // But Cloudflare injects env vars AFTER build, so we need runtime access
    if (typeof import.meta.env !== 'undefined' && import.meta.env[key]) {
        return import.meta.env[key] as string;
    }
    return '';
};

export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Debug: Log biến môi trường khi khởi tạo
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'OK' : 'MISSING');
console.log('Available env vars:', import.meta.env);

// Validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    console.error('Raw env check:', {
        url: import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'exists' : 'missing'
    });
}