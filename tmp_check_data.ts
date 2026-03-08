import { supabase } from './supabaseClient';

async function checkData() {
  const { data: users, error: uError } = await supabase.from('users').select('username, department, role');
  const { data: plans, error: pError } = await supabase.from('khctcl').select('don_vi, ten_van_de');

  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));
  console.log('--- PLANS ---');
  console.log(JSON.stringify(plans, null, 2));
}

checkData();
