import { supabase } from './supabaseClient';

async function checkDataExists() {
    const { data, error } = await supabase.from('data83tc').select('*').limit(5);
    if (error) {
        console.error('Error fetching data83tc:', error);
    } else {
        console.log('Data found in data83tc:', data);
    }
}

checkDataExists();
