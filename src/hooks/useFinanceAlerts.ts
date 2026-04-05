import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PendingMember {
    id: string;
    full_name: string;
    belt: string;
    billing_day: number;
    monthly_fee: number;
    avatar_url?: string; // Adicionado
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
            // Buscando lançamentos que não estão pagos
            const { data: unpaidPayments, error } = await supabase
                .from('payments')
                .select('id, member_id, description, amount, due_date, status, members(id, full_name, belt, avatar_url, billing_day)')
                .eq('status', 'Overdue');

            if (error) throw error;

            // Transforma em uma lista de membros únicos com suas pendências
            const membersMap = new Map<string, PendingMember>();
            
            unpaidPayments?.forEach(pay => {
                const member = pay.members as any;
                if (!member) return;
                
                if (!membersMap.has(member.id)) {
                    membersMap.set(member.id, {
                        id: member.id,
                        full_name: member.full_name || 'Desconhecido',
                        belt: member.belt || 'Branca',
                        avatar_url: member.avatar_url,
                        billing_day: member.billing_day || 10,
                        monthly_fee: pay.amount // Mostra o valor da pendência
                    });
                }
            });

            setOverdueMembers(Array.from(membersMap.values()));
        } catch (err) {
            console.error('Erro ao buscar alertas financeiros:', err);
        } finally {
            setLoading(false);
        }
    }

    return { overdueMembers, loading, refresh: fetchAlerts };
}
