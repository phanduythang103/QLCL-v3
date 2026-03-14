import { supabase } from '../supabaseClient';

async function checkUnits() {
  const { data, error } = await supabase.from('dm_don_vi').select('*').limit(10);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Units:', data);
}

checkUnits();
