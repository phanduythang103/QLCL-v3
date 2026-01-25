import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wehuxtwbomxqzxivsreb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlaHV4dHdib214cXp4aXZzcmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MjM3MzksImV4cCI6MjA4NDI5OTczOX0.Z0TsbY0GJQ3HlhZIVjaN2Ku1_UJpXCuX_B0yDmuG6tI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debug() {
    console.log("--- Checking kq_danh_gia_83tc ---");
    const { data: cols, error: errCols } = await supabase.from('kq_danh_gia_83tc').select('*').limit(1);

    if (errCols) {
        console.error("Error fetching table:", errCols.message);
    } else {
        console.log("Success fetching 1 row.");
        if (cols && cols.length > 0) {
            console.log("Row keys:", Object.keys(cols[0]));
            if (!('phieu_id' in cols[0])) {
                console.error("CRITICAL: phieu_id column is missing!");
            }
        } else {
            console.log("Table is empty.");
        }
    }

    const { count, error: errCount } = await supabase.from('kq_danh_gia_83tc').select('*', { count: 'exact', head: true });
    console.log("Total rows in table:", count);

    const { data: sheets, error: errSheets } = await supabase
        .from('kq_danh_gia_83tc')
        .select('phieu_id')
        .not('phieu_id', 'is', null)
        .limit(10);

    console.log("Rows WITH phieu_id:", sheets?.length || 0);

    if (sheets && sheets.length > 0) {
        console.log("Samples of phieu_id:", sheets.map(s => s.phieu_id));
    }
}

debug();
