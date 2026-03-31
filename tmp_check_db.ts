import { supabase } from '../supabaseClient';

async function checkTable() {
    const { data, error } = await supabase.from('data83tc').select('*').limit(1);
    if (error) {
        console.error('Error fetching data83tc:', error);
    } else {
        console.log('Table data83tc found. Columns:', Object.keys(data[0] || {}));
    }
}

checkTable();
