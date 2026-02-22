import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { maskPhone, maskCPF } from '../../lib/masks';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

export function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'student',
        phone: '',
        address: '',
        cpf: '',
        password: '' // Apenas para alteração
    });

    const isOwnProfile = currentUser?.id === id;

    useEffect(() => {
        if (!isAdmin && currentUser?.id !== id) {
            toast.error('Você só pode editar o seu próprio perfil.');
            navigate('/');
            return;
        }

        if (id) {
            fetchUser();
        }
    }, [id, isAdmin, currentUser]);

    async function fetchUser() {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    setFormData(prev => ({ ...prev, full_name: 'Novo Usuário' }));
                } else {
                    toast.error(`Erro: ${error.message}`);
                }
            } else if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    email: data.email || '',
                    role: data.role || 'student',
                    phone: data.phone || '',
                    address: data.address || '',
                    cpf: data.cpf || '',
                    password: ''
                });
            }
        } catch (err: any) {
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Atualizar Perfil no Banco
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id,
                    full_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    phone: formData.phone,
                    address: formData.address,
                    cpf: formData.cpf,
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            // 2. Atualizar Senha se preenchida e válida (apenas para o próprio usuário)
            if (isOwnProfile && formData.password && formData.password.trim().length >= 6) {
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.password
                });

                if (passwordError) {
                    if (passwordError.message.includes('should be different')) {
                        console.log('Senha é igual à anterior, ignorando atualização de senha.');
                    } else {
                        throw passwordError;
                    }
                } else {
                    toast.success('Senha atualizada com sucesso!');
                    setFormData(prev => ({ ...prev, password: '' }));
                }
            }

            toast.success('Perfil atualizado com sucesso!');
            navigate(isAdmin ? '/users' : '/');
        } catch (err: any) {
            toast.error(`Erro ao salvar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const roles = [
        { id: 'admin', label: 'Administrador', desc: 'Acesso total ao sistema, financeiro e configurações.', icon: 'shield_person' },
        { id: 'manager', label: 'Gerente', desc: 'Acesso administrativo, gestão de alunos e turmas.', icon: 'settings_account_box' },
        { id: 'coordinator', label: 'Coordenador', desc: 'Gestão de aulas, chamadas e suporte aos professores.', icon: 'clinical_notes' },
        { id: 'instructor', label: 'Instrutor', desc: 'Realiza chamadas, avaliações e gerencia progresso técnico.', icon: 'sports_kabaddi' },
        { id: 'student', label: 'Aluno', desc: 'Acesso limitado ao perfil próprio e visualização de evolução.', icon: 'person' },
    ];

    const getRoleLabel = (roleId: string) => roles.find(r => r.id === roleId)?.label || roleId;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted animate-pulse font-medium">Carregando dados...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[800px] w-full mx-auto space-y-6 pb-20">
            {/* Breadcrumb - Hidden on small mobile */}
            <div className="hidden sm:flex flex-wrap gap-2 mb-2">
                <Link to={isAdmin ? "/users" : "/"} className="text-muted hover:text-primary text-sm font-medium transition-colors">
                    {isAdmin ? "Usuários" : "Início"}
                </Link>
                <span className="text-muted text-sm font-medium">/</span>
                <span className="text-white text-sm font-medium">Editar Perfil</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-tight">Perfil</h1>
                    <p className="text-muted text-sm sm:text-base font-normal">
                        Gerenciar dados {isAdmin ? "e permissões" : ""} de <span className="text-white font-bold">{formData.full_name || 'Usuário'}</span>
                    </p>
                </div>
                <Link to={isAdmin ? "/users" : "/"}>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                        Voltar
                    </Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-4 sm:px-0">
                <Card className="p-0 border-none sm:border sm:border-border-slate">
                    <CardContent className="p-6 sm:p-8 space-y-10">
                        {/* Informações Básicas */}
                        <div className="space-y-6">
                            <h2 className="text-white text-lg font-black flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                                </span>
                                Informações Pessoais
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Nome Completo"
                                    icon="person"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Nome do usuário"
                                    required
                                />
                                <Input
                                    label="E-mail"
                                    icon="mail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                                    placeholder="email@exemplo.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Contato e Localização */}
                        <div className="space-y-6 pt-6 border-t border-border-slate/50">
                            <h2 className="text-white text-lg font-black flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-secondary text-xl">contact_phone</span>
                                </span>
                                Contato e Localização
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Telefone / WhatsApp"
                                    icon="call"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                    placeholder="(00) 00000-0000"
                                />
                                <Input
                                    label="CPF"
                                    icon="badge"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Endereço"
                                        icon="location_on"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Rua, Número, Bairro, Cidade"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Segurança (Senha) */}
                        {isOwnProfile && (
                            <div className="space-y-6 pt-6 border-t border-border-slate/50">
                                <h2 className="text-white text-lg font-black flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-yellow-500 text-xl">lock_reset</span>
                                    </span>
                                    Segurança da Conta
                                </h2>
                                <div className="max-w-md">
                                    <Input
                                        label="Nova Senha"
                                        icon="key"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Deixe em branco para não alterar"
                                    />
                                    <p className="text-[10px] text-muted ml-1 mt-2 italic font-medium tracking-wide">— Mínimo de 6 caracteres.</p>
                                </div>
                            </div>
                        )}

                        {/* Nível de Acesso (Apenas ADM) */}
                        {isAdmin && (
                            <div className="space-y-6 pt-6 border-t border-border-slate/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h2 className="text-white text-lg font-black flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-xl">key</span>
                                        </span>
                                        Nível de Acesso
                                    </h2>
                                    {isOwnProfile && (
                                        <span className="inline-flex text-[10px] bg-yellow-900/40 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                            Seu próprio perfil
                                        </span>
                                    )}
                                </div>

                                {isOwnProfile && formData.role !== 'admin' && (
                                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex gap-3 shadow-inner">
                                        <span className="material-symbols-outlined text-red-500 shrink-0">warning</span>
                                        <p className="text-red-400 text-xs font-semibold leading-relaxed">
                                            Atenção: Se você alterar seu cargo, perderá permissões administrativas instantaneamente.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: role.id })}
                                            className={cn(
                                                "flex items-start gap-4 p-5 rounded-2xl border transition-all text-left relative overflow-hidden group active:scale-[0.99]",
                                                formData.role === role.id
                                                    ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10"
                                                    : "border-border-slate bg-main/40 hover:border-slate-500"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300",
                                                formData.role === role.id
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 rotate-3"
                                                    : "bg-white/5 text-muted border-border-slate group-hover:bg-white/10"
                                            )}>
                                                <span className="material-symbols-outlined text-2xl">{role.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={cn("font-black text-sm uppercase tracking-tight", formData.role === role.id ? "text-white" : "text-slate-300")}>
                                                        {role.label}
                                                    </p>
                                                    {formData.role === role.id && (
                                                        <span className="material-symbols-outlined text-primary text-xl animate-in zoom-in duration-300">check_circle</span>
                                                    )}
                                                </div>
                                                <p className="text-muted text-xs mt-1 leading-relaxed line-clamp-2">{role.desc}</p>
                                            </div>

                                            {/* Effect decoration */}
                                            {formData.role === role.id && (
                                                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl -z-10"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isAdmin && (
                            <div className="p-5 bg-white/5 rounded-2xl border border-border-slate flex items-start gap-4 shadow-inner">
                                <span className="material-symbols-outlined text-slate-500 bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center">lock</span>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Nível de Acesso</p>
                                    <p className="text-white text-sm font-black uppercase">{getRoleLabel(formData.role)}</p>
                                    <p className="text-muted text-[10px] mt-2 italic font-medium">Somente administradores possuem permissão para trocar cargos.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Actions - Floating on mobile for quick access */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-main/80 backdrop-blur-xl border-t border-border-slate z-30 sm:static sm:p-0 sm:bg-transparent sm:border-none sm:pt-6">
                    <div className="flex flex-col sm:flex-row justify-end gap-3 max-w-[800px] mx-auto">
                        <Link to={isAdmin ? "/users" : "/"} className="hidden sm:block">
                            <Button variant="outline" className="w-full">Cancelar</Button>
                        </Link>
                        <Button
                            type="submit"
                            loading={saving}
                            className="w-full sm:min-w-[200px]"
                            icon={<span className="material-symbols-outlined">save</span>}
                        >
                            Salvar Perfil
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
