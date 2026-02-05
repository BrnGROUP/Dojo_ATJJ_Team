
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DashboardStats {
    totalStudents: number;
    activeStudents: number;
    monthlyRevenue: number;
}

export interface Member {
    id: string;
    full_name: string;
    belt: string;
    xp: number;
    status: string;
    birth_date: string;
}

export interface ClassSession {
    id: string;
    title: string;
    instructor: string;
    start_time: string;
    max_students: number;
    enrolled_count: number;
    status: string;
    type: string;
}

export function useDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        activeStudents: 0,
        monthlyRevenue: 0,
    });
    const [recentMembers, setRecentMembers] = useState<Member[]>([]);
    const [topStudents, setTopStudents] = useState<Member[]>([]);
    const [birthdays, setBirthdays] = useState<Member[]>([]);
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [highlightStudent, setHighlightStudent] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const { count: totalCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
            const { count: activeCount } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'Active');

            // Mock revenue for now (Active * 150)
            const revenue = (activeCount || 0) * 150;

            setStats({
                totalStudents: totalCount || 0,
                activeStudents: activeCount || 0,
                monthlyRevenue: revenue,
            });

            // 2. Recent Members
            const { data: recent } = await supabase
                .from('members')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(4);
            setRecentMembers(recent || []);

            // 3. Top Students
            const { data: top } = await supabase
                .from('members')
                .select('*')
                .order('xp', { ascending: false })
                .limit(5);

            if (top && top.length > 0) {
                setTopStudents(top);
                setHighlightStudent(top[0]);
            }

            // 4. Birthdays
            const { data: allActive } = await supabase.from('members').select('*').eq('status', 'Active');
            if (allActive) {
                const currentMonth = new Date().getMonth();
                const bdays = allActive.filter(m => {
                    if (!m.birth_date) return false;
                    const d = new Date(m.birth_date);
                    return d.getMonth() === currentMonth;
                }).slice(0, 3);
                setBirthdays(bdays);
            }

            // 5. Classes
            const { data: classData } = await supabase
                .from('classes')
                .select('*')
                .gte('start_time', new Date().toISOString().split('T')[0])
                .order('start_time', { ascending: true })
                .limit(3);
            setClasses(classData || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    return {
        stats,
        recentMembers,
        topStudents,
        birthdays,
        classes,
        highlightStudent,
        loading,
        refresh: fetchDashboardData
    };
}
