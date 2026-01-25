import { supabase } from './supabaseClient';

async function migrate() {
    console.log('Starting migration to populate tieu_chi and dat_muc...');

    // 1. Fetch all records from kq_danh_gia_83tc
    const { data: results, error: resError } = await supabase
        .from('kq_danh_gia_83tc')
        .select('id, ma_tieu_muc');

    if (resError) {
        console.error('Error fetching results:', resError);
        return;
    }

    // 2. Fetch mapping from data83
    const { data: data83, error: dataError } = await supabase
        .from('data83')
        .select('ma_tieu_muc, tieu_chi');

    if (dataError) {
        console.error('Error fetching data83:', dataError);
        return;
    }

    const mapping: Record<string, string> = {};
    data83.forEach(d => {
        if (d.ma_tieu_muc && d.tieu_chi) {
            mapping[d.ma_tieu_muc] = d.tieu_chi;
        }
    });

    // 3. Update records
    console.log(`Updating ${results.length} records...`);
    for (const res of results) {
        const tieuChi = mapping[res.ma_tieu_muc];
        if (tieuChi) {
            await supabase
                .from('kq_danh_gia_83tc')
                .update({ tieu_chi: tieuChi })
                .eq('id', res.id);
        }
    }

    console.log('Migration completed!');
}

migrate();
