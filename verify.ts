import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wehuxtwbomxqzxivsreb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlaHV4dHdib214cXp4aXZzcmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MjM3MzksImV4cCI6MjA4NDI5OTczOX0.Z0TsbY0GJQ3HlhZIVjaN2Ku1_UJpXCuX_B0yDmuG6tI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
    const { count: total } = await supabase.from('kq_danh_gia_83tc').select('*', { count: 'exact', head: true });
    const { count: hasId } = await supabase.from('kq_danh_gia_83tc').select('*', { count: 'exact', head: true }).not('phieu_id', 'is', null);

    console.log(`Total records: ${total}`);
    console.log(`Records with phieu_id: ${hasId}`);
}

verify();
