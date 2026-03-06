import { supabase } from './supabaseClient';

async function checkData() {
  const { data, error } = await supabase.from('khctcl').select('*');
  if (error) {
    console.error('Error fetching khctcl:', error);
  } else {
    console.log('KHCTCL Data found:', data?.length || 0, 'rows');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkData();
