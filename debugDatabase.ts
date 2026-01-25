import { supabase } from './supabaseClient';

async function debug() {
    console.log("--- Checking kq_danh_gia_83tc ---");
    const { data: cols, error: errCols } = await supabase.from('kq_danh_gia_83tc').select('*').limit(1);

    if (errCols) {
        console.error("Error fetching table:", errCols.message);
        if (errCols.message.includes("column \"phieu_id\" does not exist")) {
            console.error("CRITICAL: phieu_id column is missing!");
        }
    } else {
        console.log("Success fetching 1 row.");
        if (cols && cols.length > 0) {
            console.log("Row keys:", Object.keys(cols[0]));
            console.log("Check for phieu_id:", 'phieu_id' in cols[0]);
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
}

debug();
