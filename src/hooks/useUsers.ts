
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'manager' | 'coordinator' | 'instructor' | 'student';
    created_at: string;
    status?: string;
}

export function useUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            // Join simples - deixa o PostgREST encontrar a relação
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    members (
                        status
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error in profiles join:', error);
                throw error;
            }
            
            const formattedUsers = (data || []).map((p: any) => ({
                ...p,
                // Trata tanto joins singulares quanto arrays
                status: (Array.isArray(p.members) ? p.members[0]?.status : p.members?.status) || 'Active'
            }));

            setUsers(formattedUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteUser(id: string) {
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchUsers();
            return true;
        } catch (err) {
            console.error('Error deleting user:', err);
            return false;
        }
    }

    async function updateUserStatus(id: string, currentStatus: string) {
        const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            const { error } = await supabase
                .from('members')
                .update({ status: nextStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            await fetchUsers();
            return true;
        } catch (err) {
            console.error('Error updating status:', err);
            return false;
        }
    }

    return {
        users,
        loading,
        error,
        refresh: fetchUsers,
        updateUserStatus,
        deleteUser
    };
}
