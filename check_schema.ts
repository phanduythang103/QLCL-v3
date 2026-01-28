import { supabase } from './supabaseClient';

async function checkSchema() {
    const { data, error } = await supabase.from('bao_cao_scyk').select('*').limit(1);
    if (error) {
        console.error('Error fetching data:', error);
        // Try to get one specific column to see if it causes error
        const { error: colError } = await supabase.from('bao_cao_scyk').select('trang_thai').limit(1);
        if (colError) {
            console.error('Error fetching trang_thai column:', colError.message);
        }
    } else {
        console.log('Sample data keys:', data.length > 0 ? Object.keys(data[0]) : 'No data found');
    }
}

checkSchema();
