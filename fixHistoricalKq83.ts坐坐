import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://wehuxtwbomxqzxivsreb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlaHV4dHdib214cXp4aXZzcmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MjM3MzksImV4cCI6MjA4NDI5OTczOX0.Z0TsbY0GJQ3HlhZIVjaN2Ku1_UJpXCuX_B0yDmuG6tI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fix() {
    console.log("--- Fixing historical records in kq_danh_gia_83tc ---");
    
    const { data: records, error } = await supabase
        .from('kq_danh_gia_83tc')
        .select('*')
        .is('phieu_id', null);

    if (error) {
        console.error("Error fetching records:", error.message);
        return;
    }

    if (!records || records.length === 0) {
        console.log("No records found with NULL phieu_id.");
        return;
    }

    console.log(`Found ${records.length} records to fix.`);

    // Group records by (ngay_danh_gia, nguoi_danh_gia, don_vi_duoc_danh_gia)
    const groups: Record<string, any[]> = {};
    records.forEach(r => {
        const key = `${r.ngay_danh_gia}_${r.nguoi_danh_gia}_${r.don_vi_duoc_danh_gia}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });

    console.log(`Grouping into ${Object.keys(groups).length} unique sheets.`);

    for (const key of Object.keys(groups)) {
        const phieuId = crypto.randomUUID();
        const items = groups[key];
        const ids = items.map(i => i.id);

        console.log(`Updating sheet ${key} (${items.length} records) with phieu_id: ${phieuId}`);
        
        const { error: updateErr } = await supabase
            .from('kq_danh_gia_83tc')
            .update({ phieu_id: phieuId })
            .in('id', ids);

        if (updateErr) {
            console.error(`Error updating group ${key}:`, updateErr.message);
        } else {
            console.log(`Successfully updated group ${key}.`);
        }
    }

    console.log("--- Finished fixing records ---");
}

fix();
