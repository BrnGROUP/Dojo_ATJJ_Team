
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
    type?: string;
}

export function useMembers() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

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
            const error = err as Error;
            console.error('Error fetching members:', error);
            setError(error);
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
