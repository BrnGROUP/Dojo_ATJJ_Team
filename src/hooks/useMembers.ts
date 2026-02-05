
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Member {
    id: string;
    full_name: string;
    email: string;
    belt: string;
    stripes: number;
    plan: string;
    enrolled_classes: string[];
    status: string;
    xp: number;
}

export function useMembers() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    async function fetchMembers() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMembers((data || []) as Member[]);
        } catch (err) {
            console.error('Error fetching members:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }

    return {
        members,
        loading,
        error,
        refresh: fetchMembers
    };
}
