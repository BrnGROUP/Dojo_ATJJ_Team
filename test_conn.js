
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
            console.error('Connection error:', error.message);
            console.error('Error code:', error.code);
        } else {
            console.log('Connection successful! Data:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

test();
