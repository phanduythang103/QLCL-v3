import { createClient } from '@supabase/supabase-js';

const url = 'https://wehuxtwbomxqzxivsreb.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlaHV4dHdib214cXp4aXZzcmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MjM3MzksImV4cCI6MjA4NDI5OTczOX0.Z0TsbY0GJQ3HlhZIVjaN2Ku1_UJpXCuX_B0yDmuG6tI';
const supabase = createClient(url, key);

async function test() {
    console.log('Checking if user "pdthang" exists...');
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'pdthang');

    if (error) {
        console.error('SEARCH ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('Search Result:', JSON.stringify(data, null, 2));
    }
}

test();
