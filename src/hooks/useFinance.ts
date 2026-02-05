
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Payment {
    id: string;
    description: string;
    amount: number;
    due_date: string;
    paid_date: string | null;
    status: string;
    type: string;
    members: {
        full_name: string;
    } | null;
}

export interface FinanceStats {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
}

export function useFinance(filter: string = 'all') {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<FinanceStats>({
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
    });
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        fetchPayments();
    }, [filter]);

    async function fetchPayments() {
        setLoading(true);
        try {
            let query = supabase
                .from('payments')
                .select('*, members(full_name)')
                .order('due_date', { ascending: false });

            if (filter === 'pending') query = query.eq('status', 'Pending');
            else if (filter === 'paid') query = query.eq('status', 'Paid');
            else if (filter === 'overdue') query = query.eq('status', 'Overdue');

            const { data, error } = await query;
            if (error) throw error;

            const paymentsData = (data || []) as Payment[];
            setPayments(paymentsData);

            // Calculate stats from ALL payments (not just filtered ones)
            // In a real app, this might be a separate RPC or total summary query
            const { data: allPayments, error: statsError } = await supabase
                .from('payments')
                .select('amount, status');

            if (!statsError && allPayments) {
                const newStats = allPayments.reduce((acc: FinanceStats, curr: any) => {
                    if (curr.status === 'Paid') acc.totalPaid += curr.amount;
                    if (curr.status === 'Pending') acc.totalPending += curr.amount;
                    if (curr.status === 'Overdue') acc.totalOverdue += curr.amount;
                    return acc;
                }, { totalPaid: 0, totalPending: 0, totalOverdue: 0 });
                setStats(newStats);
            }

        } catch (err) {
            console.error('Error fetching finance data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }

    return {
        payments,
        stats,
        loading,
        error,
        refresh: fetchPayments
    };
}
