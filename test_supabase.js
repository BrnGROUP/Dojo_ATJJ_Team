
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
            console.error('Connection error:', error.message);
        } else {
            console.log('Connection successful! Data:', data);
        }
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

test();
