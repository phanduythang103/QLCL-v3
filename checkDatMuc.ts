import { supabase } from './supabaseClient';

async function checkDatMuc() {
    const { data, error } = await supabase
        .from('kq_danh_gia_83tc')
        .select('dat_muc')
        .limit(100);

    if (error) {
        console.error(error);
        return;
    }

    const uniqueValues = [...new Set(data.map(d => d.dat_muc))];
    console.log('Unique dat_muc values:', uniqueValues);
}

checkDatMuc();
