
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'manager' | 'coordinator' | 'instructor' | 'student';
    created_at: string;
}

export function useUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }

    return {
        users,
        loading,
        error,
        refresh: fetchUsers
    };
}
