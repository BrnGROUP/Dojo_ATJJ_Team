
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing connection to:', supabaseUrl);

    // Test profiles table
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying profiles:', error);
    } else {
        console.log('Successfully queried profiles. Found:', data?.length, 'rows');
    }

    // Test specific ID from user's screenshot (Claudio Bruno)
    const testId = 'a926360c-1392-43fb-8ab7-854878d450b8';
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testId)
        .single();

    if (profileError) {
        console.error('Error fetching specific profile:', profileError);
    } else {
        console.log('Found profile:', profile);
    }
}

test();
