import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [creationMethod, setCreationMethod] = useState<'invite' | 'manual'>('invite');

    const roles = [
        { id: 'admin', label: 'Administrador' },
        { id: 'manager', label: 'Gerente' },
        { id: 'coordinator', label: 'Coordenador' },
        { id: 'instructor', label: 'Instrutor' },
        { id: 'student', label: 'Aluno' },
    ];

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (creationMethod === 'invite') {
                const { error: inviteError } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        data: {
                            full_name: fullName,
                            role: role
                        },
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                });
                if (inviteError) throw inviteError;
                toast.success(`Convite enviado para ${email}!`);
            } else {
                // Cadastro Manual com Senha
                // Nota: No Supabase Client padrão, signUp cria e LOGA o novo usuário.
                // Para cadastrar OUTROS sem deslogar, o ideal é uma Edge Function.
                // Aqui faremos o flow de signUp e avisaremos sobre o login ou usaremos o profile.

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: role
                        }
                    }
                });

                if (signUpError) throw signUpError;

                // Sincronização: Criar o Membro correspondente
                if (signUpData.user) {
                    const { error: memberError } = await supabase.from('members').insert([{
                        user_id: signUpData.user.id,
                        full_name: fullName,
                        email: email,
                        type: role === 'admin' || role === 'manager' ? 'staff' : role,
                        status: 'Active',
                        belt: 'Branca'
                    }]);
                    if (memberError) console.error('Aviso: Perfil de membro não criado automaticamente:', memberError);
                }

                toast.success(`Usuário ${fullName} cadastrado com sucesso!`);
            }

            onSuccess();
            onClose();
            setEmail('');
            setFullName('');
            setPassword('');
            setRole('student');

        } catch (error: unknown) {
            const err = error as Error;
            console.error('Erro ao cadastrar:', err);
            toast.error(err.message || 'Erro ao processar cadastro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border-slate shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-border-slate flex justify-between items-center bg-main/50">
                    <h2 className="text-white text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person_add</span>
                        Novo Usuário
                    </h2>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex p-1 bg-main mx-6 mt-6 rounded-lg border border-border-slate">
                    <button
                        onClick={() => setCreationMethod('invite')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${creationMethod === 'invite' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                    >
                        Convidar por E-mail
                    </button>
                    <button
                        onClick={() => setCreationMethod('manual')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${creationMethod === 'manual' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                    >
                        Cadastro Direto
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Nome Completo</label>
                        <input
                            required
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-main border border-border-slate rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted/30 text-sm"
                            placeholder="Ex: João Silva"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">E-mail</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                            className="w-full bg-main border border-border-slate rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted/30 text-sm"
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    {creationMethod === 'manual' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Senha Inicial</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-main border border-border-slate rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted/30 text-sm"
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="role-select" className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Nível de Acesso</label>
                        <select
                            id="role-select"
                            title="Selecione o nível de acesso"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-main border border-border-slate rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm appearance-none outline-none"
                        >
                            {roles.map(r => (
                                <option key={r.id} value={r.id} className="bg-card capitalize">{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mt-4">
                        <p className="text-primary/80 text-[11px] leading-relaxed">
                            <span className="font-bold uppercase italic">Dica:</span> {creationMethod === 'invite' ?
                                "O usuário receberá um link mágico para acessar sem senha." :
                                "O usuário poderá logar imediatamente com o e-mail e a senha definida acima."}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl bg-card border border-border-slate text-white text-sm font-bold hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                creationMethod === 'invite' ? "Enviar Convite" : "Cadastrar Agora"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
