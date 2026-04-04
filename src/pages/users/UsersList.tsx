
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../lib/auth';
import { BeltAvatar } from '../../components/shared/BeltAvatar';
import { CreateUserModal } from '../../components/CreateUserModal';

export function UsersList() {
    const { users, loading, refresh, deleteUser, updateUserStatus } = useUsers();
    const { user: currentAuthUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Administrador',
            manager: 'Gerente',
            coordinator: 'Coordenador',
            instructor: 'Instrutor',
            student: 'Aluno'
        };
        return labels[role] || role;
    };

    const handleDelete = async (id: string, name: string) => {
        if (id === currentAuthUser?.id) {
            toast.error('Você não pode excluir seu próprio usuário.');
            return;
        }

        if (window.confirm(`Tem certeza que deseja excluir o usuário "${name}"? Esta ação não pode ser desfeita.`)) {
            const success = await deleteUser(id);
            if (success) {
                toast.success('Usuário excluído com sucesso!');
            } else {
                toast.error('Erro ao excluir usuário. Verifique as permissões.');
            }
        }
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-900/30 text-red-400 border-red-500/30',
            manager: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
            coordinator: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
            instructor: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
        };
        return colors[role] || 'bg-slate-900/30 text-slate-400 border-slate-500/30';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Gestão de Equipe</h1>
                    <p className="text-muted text-sm font-medium">Controle de acessos e níveis de permissão do sistema.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined mr-2 text-[20px]">person_add</span>
                    <span className="truncate">Novo Usuário</span>
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border-slate p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="w-full lg:flex-1">
                        <label className="flex flex-col min-w-40 h-11 w-full">
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
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border-slate shadow-sm overflow-hidden">
                <div className="@container overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-main/50 border-b border-border-slate">
                                <th className="px-4 md:px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider hidden md:table-cell">E-mail</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider text-center">Nível de Acesso</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider text-center">Cadastro em</th>
                                <th className="px-4 md:px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted">Carregando usuários...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-main/30 transition-colors group">
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <BeltAvatar name={user.full_name} belt="white" size="sm" showGlow={false} />
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm font-semibold truncate max-w-[120px] sm:max-w-none">{user.full_name || 'Sem nome'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-slate-400 text-sm">{user.email || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase border ${getRoleColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${user.status === 'Active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                                {user.status === 'Active' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-slate-400 text-xs">
                                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 md:gap-2 text-slate-400">
                                                <Link to={`/users/${user.id}`} className="p-1 hover:text-primary transition-colors" title="Editar Perfil">
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">manage_accounts</span>
                                                </Link>
                                                {user.id !== currentAuthUser?.id && (
                                                    <button
                                                        onClick={async () => {
                                                            const success = await updateUserStatus(user.id, user.status || 'Active');
                                                            if (success) toast.success(`Status alterado para ${user.status === 'Active' ? 'Inativo' : 'Ativo'}`);
                                                        }}
                                                        className={`p-1 transition-colors ${user.status === 'Active' ? 'hover:text-amber-500' : 'hover:text-emerald-500'}`}
                                                        title={user.status === 'Active' ? "Desativar" : "Ativar"}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">
                                                            {user.status === 'Active' ? 'do_not_disturb_on' : 'check_circle'}
                                                        </span>
                                                    </button>
                                                )}
                                                {user.id !== currentAuthUser?.id && (
                                                    <button 
                                                        onClick={() => handleDelete(user.id, user.full_name)}
                                                        className="p-1 hover:text-red-500 transition-colors" 
                                                        title="Excluir Usuário"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border-slate">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">security</span>
                        Segurança
                    </h3>
                    <p className="text-muted text-xs leading-relaxed">
                        Administradores têm acesso total ao sistema, incluindo configurações financeiras e deleção de dados.
                    </p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border-slate">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Equipe
                    </h3>
                    <p className="text-muted text-xs leading-relaxed">
                        Instrutores podem gerenciar presenças e graduações, mas não têm acesso a dados financeiros sensíveis.
                    </p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border-slate">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">history</span>
                        Logs
                    </h3>
                    <p className="text-muted text-xs leading-relaxed">
                        Todas as alterações de nível de acesso são registradas para auditoria de segurança.
                    </p>
                </div>
            </div>

            {/* Create Modal */}
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    refresh();
                    toast.success('Lista de usuários atualizada.');
                }}
            />
        </div>
    );
}
