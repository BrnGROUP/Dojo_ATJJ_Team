
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
    projectedRevenue: number;
}

export function useFinance(filter: string = 'all', month?: number, year?: number, page: number = 1, pageSize: number = 50) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState<FinanceStats>({
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
        projectedRevenue: 0,
    });
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        fetchPayments();
    }, [filter, month, year, page]);

    async function fetchPayments() {
        setLoading(true);
        try {
            let query = supabase
                .from('payments')
                .select('*, members(full_name)', { count: 'exact' })
                .order('due_date', { ascending: false });

            if (filter === 'pending') query = query.eq('status', 'Pending');
            else if (filter === 'paid') query = query.eq('status', 'Paid');
            else if (filter === 'overdue') query = query.eq('status', 'Overdue');

            if (month && year) {
                const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
                const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
                query = query.gte('due_date', firstDay).lte('due_date', lastDay);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            const paymentsData = (data || []) as Payment[];
            setPayments(paymentsData);
            setTotalCount(count || 0);

            // Calculate stats for the selected period
            const statsQuery = month && year 
                ? supabase.from('payments').select('amount, status, due_date').gte('due_date', `${year}-${month.toString().padStart(2, '0')}-01`).lte('due_date', `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`)
                : supabase.from('payments').select('amount, status, due_date');

            const { data: allPayments, error: statsError } = await statsQuery;

            if (!statsError && allPayments) {
                const newStats = allPayments.reduce((acc: FinanceStats, curr) => {
                    if (curr.status === 'Paid') acc.totalPaid += curr.amount;
                    if (curr.status === 'Pending') acc.totalPending += curr.amount;
                    if (curr.status === 'Overdue') acc.totalOverdue += curr.amount;
                    return acc;
                }, { totalPaid: 0, totalPending: 0, totalOverdue: 0, projectedRevenue: 0 });

                // Calculate Projected Revenue for NEXT MONTH
                if (month && year) {
                    const nextMonth = month === 12 ? 1 : month + 1;
                    const nextYear = month === 12 ? year + 1 : year;
                    const nextFirstDay = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
                    const nextLastDay = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${new Date(nextYear, nextMonth, 0).getDate()}`;
                    
                    const { data: nextPayments } = await supabase
                        .from('payments')
                        .select('amount')
                        .gte('due_date', nextFirstDay)
                        .lte('due_date', nextLastDay);
                    
                    const launchedNext = nextPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                    
                    // Also get potential from active members if launched is zero or as a reference
                    const { data: activeMembers } = await supabase
                        .from('members')
                        .select('monthly_fee')
                        .eq('status', 'active');
                    
                    const potentialNext = activeMembers?.reduce((sum, m) => sum + (m.monthly_fee || 0), 0) || 0;
                    
                    // User wants to see "valores JÁ LANÇADOS"
                    newStats.projectedRevenue = launchedNext > 0 ? launchedNext : potentialNext;
                }

                setStats(newStats);
            }

        } catch (err) {
            console.error('Error fetching finance data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }

    const deletePayment = async (id: string | string[]) => {
        try {
            const query = supabase.from('payments').delete();
            const { error } = Array.isArray(id) ? await query.in('id', id) : await query.eq('id', id);
            
            if (error) throw error;
            await fetchPayments();
        } catch (err) {
            console.error('Error deleting payment(s):', err);
            throw err;
        }
    };
    
    const markAsPaid = async (id: string | string[]) => {
        try {
            const query = supabase
                .from('payments')
                .update({ 
                    status: 'Paid',
                    paid_date: new Date().toISOString().split('T')[0]
                });

            const { error } = Array.isArray(id) ? await query.in('id', id) : await query.eq('id', id);
            
            if (error) throw error;
            await fetchPayments();
        } catch (err) {
            console.error('Error updating payment(s):', err);
            throw err;
        }
    };


    const generateMonthlyFees = async (year: number, month: number) => {
        try {
            // 1. Fetch ALL members (we'll filter status and type in JS)
            const { data: allMembers, error: membersError } = await supabase
                .from('members')
                .select('id, full_name, monthly_fee, billing_day, status, type');

            if (membersError) throw membersError;

            // Normalize and filter members to bill
            const members = allMembers?.filter(m => {
                const isActive = m.status?.toLowerCase() === 'active' || m.status?.toLowerCase() === 'ativo';
                const isNotStaff = m.type !== 'staff'; // "Equipe Administrativa"
                return isActive && isNotStaff;
            }) || [];

            if (members.length === 0) {
                return { count: 0, reason: 'no_active_members' };
            }

            const monthDate = new Date(year, month - 1);
            const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(monthDate).toUpperCase();
            const description = `MENSALIDADE - ${monthName}`;

            // 2. Fetch existing payments for this month to avoid duplicates
            // We use the full range of the selected month
            const firstDayOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const lastDayOfMonth = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

            const { data: existingPayments, error: existingError } = await supabase
                .from('payments')
                .select('member_id')
                .in('type', ['Monthly', 'Mensalidade'])
                .gte('due_date', firstDayOfMonth)
                .lte('due_date', lastDayOfMonth);

            if (existingError) throw existingError;

            const existingMemberIds = new Set(existingPayments?.map(p => p.member_id) || []);

            // 3. Filter members who don't have a payment yet
            const membersToBill = members.filter(m => !existingMemberIds.has(m.id));

            if (membersToBill.length === 0) {
                return { count: 0, reason: 'already_billed' };
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 4. Create batch inserts
            const newPayments = membersToBill.map(m => {
                const billingDay = m.billing_day || 10;
                const dueDateStr = `${year}-${month.toString().padStart(2, '0')}-${billingDay.toString().padStart(2, '0')}`;
                
                // Determine automatic status based on due date
                const dueDate = new Date(dueDateStr + 'T00:00:00');
                const initialStatus = dueDate < today ? 'Overdue' : 'Pending';

                return {
                    member_id: m.id,
                    description: description,
                    amount: m.monthly_fee || 0,
                    due_date: dueDateStr,
                    type: 'Mensalidade',
                    status: initialStatus
                };
            });

            const { error: insertError } = await supabase.from('payments').insert(newPayments);
            if (insertError) throw insertError;

            await fetchPayments();
            return { count: newPayments.length };

        } catch (err) {
            console.error('Error generating monthly fees:', err);
            throw err;
        }
    };

    return {
        payments,
        stats,
        totalCount,
        loading,
        error,
        refresh: fetchPayments,
        deletePayment,
        markAsPaid,
        generateMonthlyFees
    };
}
