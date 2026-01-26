import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
    totalStudents: number;
    activeStudents: number;
    monthlyRevenue: number;
}

interface Member {
    id: string;
    full_name: string;
    belt: string;
    xp: number;
    status: string;
    birth_date: string;
}

interface ClassSession {
    id: string;
    title: string;
    instructor: string;
    start_time: string;
    max_students: number;
    enrolled_count: number;
    status: string;
    type: string;
}

export function Dashboard() {
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
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

        // 2. Recent Members (Simulating "Novos Graduados" for now with latest additions)
        const { data: recent } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4);
        setRecentMembers(recent || []);

        // 3. Top Students (Ranking)
        const { data: top } = await supabase
            .from('members')
            .select('*')
            .order('xp', { ascending: false })
            .limit(5);

        if (top && top.length > 0) {
            setTopStudents(top);
            setHighlightStudent(top[0]);
        }

        // 4. Birthdays (Current Month)
        // Note: Supabase doesn't have easy month extraction in simple query, fetching all active and filtering in JS for simplicity on small scale
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
            .gte('start_time', new Date().toISOString().split('T')[0]) // From today
            .order('start_time', { ascending: true })
            .limit(3);
        setClasses(classData || []);
    }

    const getBeltColor = (belt: string) => {
        switch (belt?.toLowerCase()) {
            case 'white': return 'text-white';
            case 'blue': return 'text-blue-500';
            case 'purple': return 'text-purple-500';
            case 'brown': return 'text-amber-700';
            case 'black': return 'text-white';
            default: return 'text-slate-300';
        }
    };

    const getBeltGlow = (belt: string) => {
        switch (belt?.toLowerCase()) {
            case 'white': return 'belt-glow-white'; // Need to define if not exists or use custom shadow
            case 'blue': return 'belt-glow-blue';
            case 'purple': return 'belt-glow-purple';
            case 'brown': return 'belt-glow-brown';
            case 'black': return 'belt-glow-black';
            default: return '';
        }
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="dashboard-card p-6 rounded-2xl flex flex-col justify-between bg-card">
                    <div className="flex justify-between items-start mb-6">
                        <p className="text-muted text-xs font-semibold uppercase tracking-wider">Total de Alunos</p>
                        <div className="sparkline rounded opacity-50"></div>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-extrabold text-white">{stats.totalStudents}</h3>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">+12%</span>
                    </div>
                </div>
                <div className="dashboard-card p-6 rounded-2xl flex flex-col justify-between bg-card">
                    <div className="flex justify-between items-start mb-6">
                        <p className="text-muted text-xs font-semibold uppercase tracking-wider">Aulas no Mês</p>
                        <div className="sparkline rounded opacity-50"></div>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-extrabold text-white">42</h3>
                        <span className="text-[11px] font-bold text-muted bg-white/5 px-2 py-0.5 rounded-md">ESTÁVEL</span>
                    </div>
                </div>
                <div className="dashboard-card p-6 rounded-2xl flex flex-col justify-between bg-card">
                    <div className="flex justify-between items-start mb-6">
                        <p className="text-muted text-xs font-semibold uppercase tracking-wider">Média de XP</p>
                        <div className="sparkline rounded opacity-50"></div>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-extrabold text-white">1,240</h3>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">+8%</span>
                    </div>
                </div>
                <div className="dashboard-card p-6 rounded-2xl flex flex-col justify-between bg-card">
                    <div className="flex justify-between items-start mb-6">
                        <p className="text-muted text-xs font-semibold uppercase tracking-wider">Faturamento (Est.)</p>
                        <div className="sparkline rounded opacity-50"></div>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-extrabold text-white">R$ {(stats.monthlyRevenue / 1000).toFixed(1)}k</h3>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">+5%</span>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border-slate">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Mural de Destaques</h2>
                        <p className="text-muted text-sm font-medium">Reconhecimento e conquistas da semana</p>
                    </div>
                    <button className="flex items-center gap-2 text-white font-bold text-sm bg-primary px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-all shadow-[0_0_15px_rgba(215,38,56,0.3)]">
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Novo Destaque
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Recent Graduates / Members */}
                    <div className="lg:col-span-6 flex flex-col">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-sm">military_tech</span>
                            Novos Graduados (Recentes)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recentMembers.map((member) => (
                                <div key={member.id} className="flex items-center gap-4 p-4 rounded-2xl bg-main border border-border-slate hover:border-primary/50 transition-all cursor-default group">
                                    <div className="relative">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-zinc-800 text-white font-bold ${getBeltGlow(member.belt)}`}>
                                            {getInitials(member.full_name)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{member.full_name}</p>
                                        <span className={`text-[10px] font-black uppercase ${getBeltColor(member.belt)}`}>Faixa {member.belt}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Aluno Destaque */}
                    <div className="lg:col-span-3 flex flex-col">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500 text-sm">stars</span>
                            Aluno Destaque
                        </h3>
                        <div className="bg-gradient-to-br from-primary/20 to-main rounded-3xl p-6 text-center border border-primary/20 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-20"></div>
                            {highlightStudent ? (
                                <div className="relative z-10">
                                    <div className="relative inline-block mb-4">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-zinc-800 text-2xl font-black text-white p-0.5 ${getBeltGlow(highlightStudent.belt)}`}>
                                            {getInitials(highlightStudent.full_name)}
                                        </div>
                                        <div className="absolute -bottom-1 right-0 bg-yellow-400 text-main font-black text-[9px] px-2 py-0.5 rounded-full border border-main">TOP #1</div>
                                    </div>
                                    <h4 className="text-lg font-bold text-white">{highlightStudent.full_name}</h4>
                                    <p className="text-primary font-black text-[11px] uppercase tracking-wider mt-1">{highlightStudent.xp} XP</p>
                                    <div className="mt-4 flex gap-2 justify-center">
                                        <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold text-white">12 Aulas</span>
                                        <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold text-white">3 Medalhas</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted text-sm">Sem dados suficientes.</p>
                            )}
                        </div>
                    </div>

                    {/* Birthdays */}
                    <div className="lg:col-span-3 flex flex-col">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-pink-500 text-sm">cake</span>
                            Aniversariantes (Mês)
                        </h3>
                        <div className="space-y-4 flex flex-col flex-1">
                            {birthdays.length > 0 ? birthdays.map(b => (
                                <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border-slate bg-main/30">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-800 text-xs font-bold text-white">
                                        {getInitials(b.full_name)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{b.full_name}</p>
                                        <p className="text-[10px] text-muted font-medium">{new Date(b.birth_date).getDate()}/{new Date(b.birth_date).getMonth() + 1}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-pink-500 text-lg ml-auto">celebration</span>
                                </div>
                            )) : (
                                <p className="text-muted text-xs italic p-4 text-center">Nenhum aniversariante este mês.</p>
                            )}
                            <button className="w-full mt-auto py-3 bg-white/5 text-muted rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-white hover:bg-white/10 transition-colors">Calendário</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Agenda */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">Agenda do Dia</h2>
                        <button className="text-primary font-bold text-xs hover:underline">Ver agenda completa</button>
                    </div>
                    <div className="bg-card rounded-3xl border border-border-slate overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-main/40 border-b border-border-slate">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-widest">Horário</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-widest">Modalidade</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-widest">Instrutor</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-widest">Lotação</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-slate/50">
                                    {classes.map(c => {
                                        const startTime = new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const occupancy = Math.round((c.enrolled_count / c.max_students) * 100);
                                        return (
                                            <tr key={c.id} className="hover:bg-main/20 transition-colors">
                                                <td className="px-8 py-5 text-sm font-bold text-white">{startTime}</td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-2.5 py-1 ${c.type === 'No-Gi' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-white'} border text-[9px] font-black rounded-lg uppercase`}>
                                                        {c.title}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-semibold text-muted">{c.instructor}</td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-20 bg-main h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-primary h-full shadow-[0_0_8px_#d72638]" style={{ width: `${occupancy}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-white">{occupancy}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full border border-primary/20 uppercase">{c.status}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Ranking */}
                <div className="xl:col-span-4 space-y-6">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Ranking Elite</h2>
                    <div className="bg-card rounded-3xl p-8 border border-border-slate">
                        <div className="mb-10">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Progresso do Dojo</p>
                                    <h3 className="text-2xl font-black text-white">Nível 42</h3>
                                </div>
                                <span className="text-[10px] font-bold text-muted px-3 py-1 bg-main rounded-full">75% p/ Nv. 43</span>
                            </div>
                            <div className="h-2 w-full bg-main rounded-full overflow-hidden border border-border-slate">
                                <div className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full w-[75%]"></div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {topStudents.slice(0, 3).map((student, index) => (
                                <div key={student.id} className="flex items-center justify-between group cursor-pointer hover:bg-main/50 p-2 -mx-2 rounded-2xl transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 text-xs font-black ${index === 0 ? 'text-yellow-400' : 'text-muted'} italic`}>{String(index + 1).padStart(2, '0')}</div>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-800 border-2 ${index === 0 ? 'border-yellow-400/50' : 'border-border-slate'} shadow-sm text-white font-bold`}>
                                            {getInitials(student.full_name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{student.full_name}</p>
                                            <p className={`text-[9px] font-bold uppercase ${getBeltColor(student.belt)}`}>Faixa {student.belt}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-white bg-primary/20 border border-primary/30 px-3 py-1 rounded-lg">{student.xp} XP</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-sm">
                            Ranking Completo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
