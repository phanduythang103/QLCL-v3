// Runtime configuration for Supabase
// IMPORTANT: Vite replaces import.meta.env.VITE_XXX at BUILD time.
// Do NOT use dynamic keys like import.meta.env[key] as they won't be replaced.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// Debug in non-production or if missing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase configuration missing from environment variables');
    console.log('Mode:', import.meta.env.MODE);
}