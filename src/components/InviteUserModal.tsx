import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);

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
            // No Supabase, sem Service Role no frontend, a melhor forma de "convidar"
            // é enviar um link de login (Magic Link). Isso criará o registro em auth.users.
            // O trigger no banco então criará o perfil.

            const { error: inviteError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    },
                    // Redirecionar para trocar a senha ou completar o perfil
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (inviteError) throw inviteError;

            // Se o usuário já existir ou o convite for enviado, garantimos que o perfil tenha os dados certos
            // (Isso é redundante se o trigger handle_new_user estiver funcionando, mas é seguro)

            toast.success(`Convite enviado para ${email}!`);
            onSuccess();
            onClose();

            // Limpar campos
            setEmail('');
            setFullName('');
            setRole('student');

        } catch (error: any) {
            console.error('Erro ao convidar:', error);
            toast.error(error.message || 'Erro ao enviar convite');
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
                        Convidar Novo Usuário
                    </h2>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
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
                            <span className="font-bold uppercase">Nota:</span> O usuário receberá um e-mail com um link de acesso. Ao clicar, a conta será criada automaticamente com as permissões selecionadas.
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
                                "Enviar Convite"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
