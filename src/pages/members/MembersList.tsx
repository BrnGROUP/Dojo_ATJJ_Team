
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useMembers } from '../../hooks/useMembers';
import { toast } from 'react-hot-toast';
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts';
import type { Member } from '../../hooks/useMembers';
import { XPModal } from '../../components/XPModal';
import { BeltAvatar } from '../../components/shared/BeltAvatar';
import { getBeltColor, getBeltBg } from '../../lib/ui-utils';

export function MembersList() {
    const { members, loading, refresh, deleteMember, updateMemberStatus } = useMembers();
    const { overdueMembers } = useFinanceAlerts();
    const [xpModalOpen, setXpModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const { isAdmin, isManager, isCoordinator } = useAuth();
    const canManageMembers = isAdmin || isManager || isCoordinator;
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, student, instructor, teacher, staff

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            student: 'Aluno',
            instructor: 'Instrutor',
            teacher: 'Professor',
            staff: 'Equipe'
        };
        return labels[type] || 'Aluno';
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Deseja realmente excluir o membro "${name}"? Todos os dados vinculados serão perdidos.`)) {
            const success = await deleteMember(id);
            if (success) {
                toast.success('Membro excluído com sucesso!');
            } else {
                toast.error('Erro ao excluir membro. Verifique as permissões.');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Membros & Equipe</h1>
                    <p className="text-muted text-sm font-medium leading-normal">Gerencie todos os membros do Dojo, desde alunos até professores e administradores.</p>
                </div>
                {canManageMembers && (
                    <Link to="/members/new" className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined mr-2 text-[20px]">person_add</span>
                        <span className="truncate">+ Novo Membro</span>
                    </Link>
                )}
            </div>

            <div className="bg-card rounded-xl border border-border-slate p-3 md:p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
                    <div className="w-full md:flex-1">
                        <label className="flex flex-col min-w-0 h-11 w-full">
                            <div className="flex w-full flex-1 items-stretch rounded-lg h-full overflow-hidden border border-border-slate">
                                <div className="text-muted flex items-center justify-center pl-4 bg-main">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <input
                                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-main focus:border-none h-full placeholder:text-muted px-4 pl-2 text-sm font-normal leading-normal"
                                    placeholder="Pesquisar por nome ou e-mail..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </label>
                    </div>
                    <div className="flex bg-main rounded-lg p-1 border border-border-slate overflow-x-auto custom-scrollbar whitespace-nowrap -mx-1 md:mx-0 flex-shrink-0">
                        <button onClick={() => setTypeFilter('all')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex-shrink-0 ${typeFilter === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}>Todos</button>
                        <button onClick={() => setTypeFilter('student')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex-shrink-0 ${typeFilter === 'student' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}>Alunos</button>
                        <button onClick={() => setTypeFilter('instructor')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex-shrink-0 ${typeFilter === 'instructor' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}>Instrutores</button>
                        <button onClick={() => setTypeFilter('teacher')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex-shrink-0 ${typeFilter === 'teacher' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}>Professores</button>
                        <button onClick={() => setTypeFilter('staff')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex-shrink-0 ${typeFilter === 'staff' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}>Equipe</button>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border-slate shadow-sm overflow-hidden">
                <div className="@container overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-main/50 border-b border-border-slate">
                                <th className="px-4 md:px-6 py-4 text-white text-xs font-bold uppercase tracking-wider">Membro</th>
                                <th className="px-6 py-4 text-white text-xs font-bold uppercase tracking-wider hidden xl:table-cell">E-mail</th>
                                <th className="px-6 py-4 text-white text-xs font-bold uppercase tracking-wider hidden lg:table-cell">Turmas</th>
                                <th className="px-4 md:px-6 py-4 text-white text-xs font-bold uppercase tracking-wider hidden sm:table-cell">Faixa</th>
                                <th className="px-4 md:px-6 py-4 text-white text-xs font-bold uppercase tracking-wider text-center">XP</th>
                                <th className="px-4 md:px-6 py-4 text-white text-xs font-bold uppercase tracking-wider text-center">Status</th>
                                <th className="px-4 md:px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted italic">Carregando comunidade...</td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted italic">Nenhum registro encontrado.</td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-main/30 transition-colors group">
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <BeltAvatar
                                                    name={member.full_name}
                                                    belt={member.belt}
                                                    size="md"
                                                    showGlow={false}
                                                    avatarUrl={member.avatar_url}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm font-semibold truncate max-w-[120px] sm:max-w-none">{member.full_name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${member.type === 'teacher' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                member.type === 'instructor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                    member.type === 'staff' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                            } font-bold uppercase tracking-wider`}>
                                                            {getTypeLabel(member.type || 'student')}
                                                        </span>
                                                        <span className="text-[10px] text-muted sm:hidden font-medium">Faixa {member.belt}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden xl:table-cell">
                                            <span className="text-slate-400 text-sm">{member.email || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {member.enrolled_classes && member.enrolled_classes.length > 0 ? (
                                                    member.enrolled_classes.map((cls, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-main border border-border-slate text-slate-300 text-[10px] font-medium">
                                                            {cls}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted text-xs">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full shadow-sm border border-zinc-700 ${getBeltBg(member.belt)}`}></span>
                                                <span className={`${getBeltColor(member.belt)} text-xs font-bold`}>
                                                    {member.belt}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="material-symbols-outlined text-primary text-[16px]">bolt</span>
                                                <span className="text-white text-xs font-black">{member.xp || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${member.status === 'Active' ? 'bg-emerald-900/30 text-emerald-400' :
                                                    member.status === 'Paused' ? 'bg-yellow-900/30 text-yellow-400' :
                                                        'bg-red-900/30 text-red-400'
                                                    }`}>
                                                    {member.status === 'Active' ? 'Ativo' : member.status === 'Paused' ? 'Pausado' : 'Inativo'}
                                                </span>
                                                {overdueMembers.some(om => om.id === member.id) && (
                                                    <div className="flex items-center gap-1 text-red-500 animate-pulse">
                                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                                        <span className="text-[8px] font-black uppercase">Pendência</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 md:gap-2 text-slate-400">
                                                {canManageMembers && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setXpModalOpen(true);
                                                        }}
                                                        className="p-1 hover:text-primary transition-colors group"
                                                        title="Gerenciar XP"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] md:text-[20px] group-hover:animate-pulse">bolt</span>
                                                    </button>
                                                )}
                                                {canManageMembers && (
                                                    <button
                                                        onClick={async () => {
                                                            const success = await updateMemberStatus(member.id, member.status);
                                                            if (success) toast.success(`Status alterado!`);
                                                        }}
                                                        className={`p-1 transition-colors ${member.status === 'Active' ? 'hover:text-amber-500' : 'hover:text-emerald-500'}`}
                                                        title={member.status === 'Active' ? "Desativar" : "Ativar"}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">
                                                            {member.status === 'Active' ? 'do_not_disturb_on' : 'check_circle'}
                                                        </span>
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/members/${member.id}`}
                                                    className="p-1 hover:text-primary transition-colors"
                                                    title={canManageMembers ? "Editar" : "Ver Detalhes"}
                                                >
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">
                                                        {canManageMembers ? 'edit' : 'visibility'}
                                                    </span>
                                                </Link>
                                                {canManageMembers && (
                                                    <button 
                                                        onClick={() => handleDelete(member.id, member.full_name)}
                                                        className="p-1 hover:text-red-500 transition-colors" 
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* XP Modal */}
            {selectedMember && (
                <XPModal
                    isOpen={xpModalOpen}
                    onClose={() => {
                        setXpModalOpen(false);
                        setSelectedMember(null);
                    }}
                    memberId={selectedMember.id}
                    memberName={selectedMember.full_name}
                    currentXP={selectedMember.xp || 0}
                    onSuccess={refresh}
                />
            )}
        </div>
    );
}
