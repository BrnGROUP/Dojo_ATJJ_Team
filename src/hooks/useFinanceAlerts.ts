import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PendingMember {
    id: string;
    full_name: string;
    belt: string;
    billing_day: number;
    monthly_fee: number;
}

export function useFinanceAlerts() {
    const [overdueMembers, setOverdueMembers] = useState<PendingMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    async function fetchAlerts() {
        setLoading(true);
        try {
            // Chamando a RPC que criamos na migração
            const { data, error } = await supabase.rpc('get_pending_members');

            if (error) throw error;
            setOverdueMembers(data || []);
        } catch (err) {
            console.error('Erro ao buscar alertas financeiros:', err);
        } finally {
            setLoading(false);
        }
    }

    return { overdueMembers, loading, refresh: fetchAlerts };
}
