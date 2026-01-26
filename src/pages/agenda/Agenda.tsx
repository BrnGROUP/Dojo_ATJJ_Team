import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface ClassSession {
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

export function Agenda() {
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, today, week

    useEffect(() => {
        async function fetchClasses() {
            setLoading(true);
            let query = supabase
                .from('classes')
                .select('*')
                .order('start_time', { ascending: true });

            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.gte('start_time', `${today}T00:00:00`).lte('start_time', `${today}T23:59:59`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching classes:', error);
            } else {
                setClasses(data || []);
            }
            setLoading(false);
        }

        fetchClasses();
    }, [filter]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Agenda de Aulas</h1>
                <div className="flex gap-3">
                    <div className="flex bg-main rounded-lg p-1 border border-border-slate">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter('today')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'today' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}
                        >
                            Hoje
                        </button>
                    </div>
                    <Link to="/agenda/new" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary-hover transition-all">
                        <span className="material-symbols-outlined mr-2 text-[20px]">add_circle</span>
                        <span className="truncate">Nova Aula</span>
                    </Link>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border-slate shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-main/50 border-b border-border-slate">
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Data / Horário</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Aula</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Instrutor</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Lotação</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider text-center">Tipo</th>
                                <th className="px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted">Carregando agenda...</td>
                                </tr>
                            ) : classes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted">Nenhuma aula agendada para este período.</td>
                                </tr>
                            ) : (
                                classes.map((cls) => {
                                    const occupancy = Math.round((cls.enrolled_count / cls.max_students) * 100);
                                    return (
                                        <tr key={cls.id} className="hover:bg-main/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm font-bold">{formatTime(cls.start_time)} - {formatTime(cls.end_time)}</span>
                                                    <span className="text-muted text-xs">{formatDate(cls.start_time)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-white text-sm font-semibold">{cls.title}</td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">{cls.instructor}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full max-w-[120px] space-y-1">
                                                    <div className="flex justify-between text-[10px] text-muted font-bold">
                                                        <span>{cls.enrolled_count}/{cls.max_students}</span>
                                                        <span>{occupancy}%</span>
                                                    </div>
                                                    <div className="w-full bg-main h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${occupancy > 90 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${occupancy}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${cls.type === 'Gi' ? 'bg-white/5 border-white/10 text-white' :
                                                    cls.type === 'No-Gi' ? 'bg-primary/10 border-primary/20 text-primary' :
                                                        'bg-green-500/10 border-green-500/20 text-green-500'
                                                    }`}>
                                                    {cls.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                                                    <button className="p-1 hover:text-primary transition-colors" title="Editar">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button className="p-1 hover:text-red-500 transition-colors" title="Cancelar Aula">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
