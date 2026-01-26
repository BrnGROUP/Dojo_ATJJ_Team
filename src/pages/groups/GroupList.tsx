import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Group {
    id: string;
    name: string;
    description: string;
    schedule_description: string;
    color: string;
}

export function GroupList() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, []);

    async function fetchGroups() {
        setLoading(true);
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching groups:', error);
        } else {
            setGroups(data || []);
        }
        setLoading(false);
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta turma?')) return;

        const { error } = await supabase.from('groups').delete().eq('id', id);

        if (error) {
            alert('Erro ao excluir turma.');
        } else {
            fetchGroups();
        }
    };

    const getGroupColor = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
            case 'purple': return 'bg-purple-500/10 border-purple-500/20 text-purple-500';
            case 'green': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            case 'orange': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
            default: return 'bg-white/5 border-white/10 text-white';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Turmas & Modalidades</h1>
                <Link to="/groups/new" className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary-hover transition-all">
                    <span className="material-symbols-outlined mr-2 text-[20px]">add_circle</span>
                    <span className="truncate">Nova Turma</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-muted">Carregando turmas...</div>
                ) : groups.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted">Nenhuma turma cadastrada.</div>
                ) : (
                    groups.map(group => (
                        <div key={group.id} className="bg-card rounded-xl border border-border-slate p-6 hover:border-primary/50 transition-all group relative flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getGroupColor(group.color)}`}>
                                    <span className="material-symbols-outlined">groups</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/groups/${group.id}`} className="p-1.5 hover:bg-main rounded-md text-muted hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </Link>
                                    <button onClick={() => handleDelete(group.id)} className="p-1.5 hover:bg-main rounded-md text-muted hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 break-words line-clamp-2 min-h-[3.5rem] flex items-center">{group.name}</h3>
                            <p className="text-sm text-slate-400 mb-6 line-clamp-3 leading-relaxed">{group.description}</p>

                            <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-muted bg-main py-3 px-3 rounded-lg border border-border-slate/50">
                                <span className="material-symbols-outlined text-[16px] shrink-0">schedule</span>
                                <span className="truncate">{group.schedule_description || 'Horários variados'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
