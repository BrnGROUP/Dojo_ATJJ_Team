import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Member {
    id: string;
    full_name: string;
    email: string;
    belt: string;
    stripes: number;
    plan: string;
    enrolled_classes: string[];
    status: string;
}

export function MembersList() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, []);

    async function fetchMembers() {
        setLoading(true);
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching members:', error);
        } else {
            setMembers(data || []);
        }
        setLoading(false);
    }

    const getBeltColor = (belt: string) => {
        switch (belt?.toLowerCase()) {
            case 'white': return 'text-white';
            case 'blue': return 'text-blue-500';
            case 'purple': return 'text-purple-500';
            case 'brown': return 'text-amber-700';
            case 'black': return 'text-white'; // Should distinguish or keep white
            default: return 'text-slate-300';
        }
    };

    const getBeltBg = (belt: string) => {
        switch (belt?.toLowerCase()) {
            case 'white': return 'bg-white';
            case 'blue': return 'bg-blue-600';
            case 'purple': return 'bg-purple-600';
            case 'brown': return 'bg-[#422e25]';
            case 'black': return 'bg-neutral-900 border-red-600 border-l-2';
            default: return 'bg-slate-300';
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Lista de Alunos</h1>
                <Link to="/members/new" className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary-hover transition-all">
                    <span className="material-symbols-outlined mr-2 text-[20px]">person_add</span>
                    <span className="truncate">+ Novo Aluno</span>
                </Link>
            </div>

            <div className="bg-card rounded-xl border border-border-slate p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="w-full lg:flex-1">
                        <label className="flex flex-col min-w-40 h-11 w-full">
                            <div className="flex w-full flex-1 items-stretch rounded-lg h-full overflow-hidden border border-border-slate">
                                <div className="text-muted flex items-center justify-center pl-4 bg-main">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-main focus:border-none h-full placeholder:text-muted px-4 pl-2 text-sm font-normal leading-normal" placeholder="Pesquisar por nome ou e-mail..." />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border-slate shadow-sm overflow-hidden">
                <div className="@container overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-main/50 border-b border-border-slate">
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Nome do Aluno</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider hidden md:table-cell">E-mail</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Turma</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Faixa</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted">Carregando alunos...</td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted">Nenhum aluno encontrado.</td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-main/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                    {getInitials(member.full_name)}
                                                </div>
                                                <span className="text-white text-sm font-semibold">{member.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-slate-400 text-sm">{member.email || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {member.enrolled_classes && member.enrolled_classes.length > 0 ? (
                                                    member.enrolled_classes.map((cls, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-main border border-border-slate text-slate-300 text-[10px] font-medium">
                                                            {cls === 'fundamentals' ? 'Fundamentos' :
                                                                cls === 'advanced' ? 'Avançado' :
                                                                    cls === 'nogi' ? 'No-Gi' :
                                                                        cls === 'kids' ? 'Kids' : cls}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted text-xs">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`size-3 rounded-full shadow-sm border border-zinc-700 ${getBeltBg(member.belt)}`}></span>
                                                <span className={`${getBeltColor(member.belt)} text-xs font-bold`}>
                                                    {member.belt} {member.stripes > 0 ? `(${member.stripes} graus)` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${member.status === 'Active' ? 'bg-emerald-900/30 text-emerald-400' :
                                                member.status === 'Paused' ? 'bg-yellow-900/30 text-yellow-400' :
                                                    'bg-red-900/30 text-red-400'
                                                }`}>
                                                {member.status === 'Active' ? 'Ativo' : member.status === 'Paused' ? 'Pausado' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                                                <Link to={`/members/${member.id}`} className="p-1 hover:text-primary transition-colors" title="Editar">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </Link>
                                                <button className="p-1 hover:text-primary transition-colors" title="Desativar">
                                                    <span className="material-symbols-outlined text-[20px]">do_not_disturb_on</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
