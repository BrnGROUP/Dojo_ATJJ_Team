
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ClassSession {
    id: string;
    title: string;
    instructor: string;
    start_time: string;
    end_time: string;
    max_students: number;
    enrolled_count: number;
    status: string;
    type: string;
}

export function useAgenda(filter: string = 'all') {
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        fetchClasses();
    }, [filter]);

    async function fetchClasses() {
        setLoading(true);
        try {
            let query = supabase
                .from('classes')
                .select('*')
                .order('start_time', { ascending: true });

            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.gte('start_time', `${today}T00:00:00`).lte('start_time', `${today}T23:59:59`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setClasses(data || []);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }

    const deleteClass = async (id: string) => {
        try {
            const { error } = await supabase.from('classes').delete().eq('id', id);
            if (error) throw error;
            await fetchClasses();
            return true;
        } catch (err) {
            console.error('Error deleting class:', err);
            return false;
        }
    };

    return {
        classes,
        loading,
        error,
        refresh: fetchClasses,
        deleteClass
    };
}
