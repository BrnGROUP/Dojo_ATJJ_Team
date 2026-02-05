import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
}

export function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState('student');

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    async function fetchUser() {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            toast.error('Erro ao buscar usuário.');
            navigate('/users');
        } else if (data) {
            setUser(data);
            setSelectedRole(data.role);
        }
        setLoading(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({ role: selectedRole, updated_at: new Date().toISOString() })
            .eq('id', id);

        setSaving(false);

        if (error) {
            console.error('Error updating user role:', error);
            toast.error('Erro ao atualizar nível de acesso.');
        } else {
            toast.success('Permissões atualizadas com sucesso!');
            navigate('/users');
        }
    };

    const roles = [
        { id: 'admin', label: 'Administrador', desc: 'Acesso total ao sistema, financeiro e configurações.', color: 'text-red-400', icon: 'shield_person' },
        { id: 'manager', label: 'Gerente', desc: 'Acesso administrativo, gestão de alunos e turmas.', color: 'text-purple-400', icon: 'settings_account_box' },
        { id: 'coordinator', label: 'Coordenador', desc: 'Gestão de aulas, chamadas e suporte aos professores.', color: 'text-blue-400', icon: 'clinical_notes' },
        { id: 'instructor', label: 'Instrutor', desc: 'Realiza chamadas, avaliações e gerencia progresso técnico.', color: 'text-emerald-400', icon: 'sports_kabaddi' },
        { id: 'student', label: 'Aluno', desc: 'Acesso limitado ao perfil próprio e visualização de evolução.', color: 'text-slate-400', icon: 'person' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <p className="text-muted animate-pulse">Carregando dados do usuário...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[800px] w-full mx-auto space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                <Link to="/users" className="text-muted hover:text-primary text-sm font-medium">Usuários</Link>
                <span className="text-muted text-sm font-medium">/</span>
                <span className="text-white text-sm font-medium">Editar Permissões</span>
            </div>

            <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Editar Permissões</h1>
                    <p className="text-muted text-base font-normal">Alterar nível de acesso de <span className="text-white font-bold">{user?.full_name}</span></p>
                </div>
                <Link to="/users" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold leading-normal transition-all">
                    <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                    <span>Voltar</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card p-8 rounded-2xl border border-border-slate space-y-8">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-main/50 border border-border-slate">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xl">
                            {user?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                            <p className="text-white font-bold">{user?.full_name}</p>
                            <p className="text-muted text-sm">{user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-white text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">key</span>
                            Selecione o Nível de Acesso
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    className={cn(
                                        "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group",
                                        selectedRole === role.id
                                            ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(215,38,56,0.1)]"
                                            : "border-border-slate bg-main hover:border-gray-500"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                        selectedRole === role.id ? "bg-primary text-white border-primary" : "bg-white/5 text-muted border-border-slate group-hover:text-white"
                                    )}>
                                        <span className="material-symbols-outlined">{role.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className={cn("font-bold", selectedRole === role.id ? "text-white" : "text-slate-200")}>{role.label}</p>
                                            {selectedRole === role.id && (
                                                <span className="material-symbols-outlined text-primary">check_circle</span>
                                            )}
                                        </div>
                                        <p className="text-muted text-xs mt-1 leading-relaxed">{role.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-border-slate">
                    <Link to="/users" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-card text-white text-sm font-bold leading-normal hover:bg-card/80 transition-all border border-border-slate">
                        Cancelar
                    </Link>
                    <button
                        disabled={saving}
                        className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                        type="submit"
                    >
                        <span className="material-symbols-outlined mr-2">save</span>
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
