const { createClient } = require('@supabase/supabase-js');

const url = 'https://wehuxtwbomxqzxivsreb.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlaHV4dHdib214cXp4aXZzcmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MjM3MzksImV4cCI6MjA4NDI5OTczOX0.Z0TsbY0GJQ3HlhZIVjaN2Ku1_UJpXCuX_B0yDmuG6tI';
const supabase = createClient(url, key);

async function test() {
    console.log('Testing login for pdthang...');
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', 'pdthang')
        .eq('password', '123456')
        .eq('status', 'Hoạt động')
        .single();

    if (error) {
        console.error('LOGIN ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('LOGIN SUCCESS. Data:', JSON.stringify(data, null, 2));
        if ('avatar' in data) {
            console.log('Column "avatar" exists.');
        } else {
            console.log('Column "avatar" DOES NOT exist in returned data.');
        }
    }
}

test();
