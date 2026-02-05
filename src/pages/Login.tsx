import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export function Login() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Login realizado com sucesso!');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: 'admin' // First user typically wants to be admin
                        }
                    }
                });
                if (error) throw error;
                toast.success('Conta criada! Você já pode entrar.');
                setMode('login');
            }
            navigate('/');
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'Erro ao processar solicitação.');
            toast.error(mode === 'login' ? 'Credenciais inválidas.' : 'Erro ao criar conta.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="bg-main min-h-screen flex flex-col font-display text-white">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-border-slate bg-card px-10 py-3">
                <div className="flex items-center gap-3 text-white">
                    <img src="/logo.png" alt="ATJJ Logo" className="w-8 h-8 object-contain" />
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">ATJJ Dojo v4</h2>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="layout-content-container flex flex-col max-w-[480px] w-full bg-card shadow-2xl rounded-2xl overflow-hidden border border-border-slate">
                    <div className="relative h-32 bg-white flex items-center justify-center border-b border-border-slate overflow-hidden">
                        <img src="/logo.png" alt="ATJJ Dojo Logo" className="h-24 w-auto object-contain drop-shadow-2xl" />
                    </div>
                    <div className="p-8">
                        <h1 className="text-white tracking-light text-2xl font-bold leading-tight text-center pb-6">
                            {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
                        </h1>

                        {error && (
                            <div className="mb-6 animate-fade-in">
                                <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-red-500">error</span>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-red-400 text-sm font-bold leading-tight">Falha na Autenticação</p>
                                            <p className="text-red-300 text-xs font-normal leading-normal">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="flex flex-col gap-1">
                                    <label className="flex flex-col w-full">
                                        <p className="text-muted text-sm font-medium leading-normal pb-1.5">Nome Completo</p>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl">person</span>
                                            <input
                                                className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-slate bg-main h-12 placeholder:text-muted/50 pl-10 pr-4 text-sm font-normal"
                                                placeholder="Seu nome"
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </label>
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                <label className="flex flex-col w-full">
                                    <p className="text-muted text-sm font-medium leading-normal pb-1.5">E-mail</p>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl">mail</span>
                                        <input
                                            className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-slate bg-main h-12 placeholder:text-muted/50 pl-10 pr-4 text-sm font-normal"
                                            placeholder="ex: sensei@atjjdojo.com"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </label>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="flex flex-col w-full">
                                    <p className="text-muted text-sm font-medium leading-normal pb-1.5">Senha</p>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl">lock</span>
                                        <input
                                            className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-slate bg-main h-12 placeholder:text-muted/50 pl-10 pr-4 text-sm font-normal"
                                            placeholder="••••••••"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="pt-2">
                                <button
                                    className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-primary-hover text-white text-base font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="material-symbols-outlined animate-spin">sync</span>
                                    ) : (
                                        <span className="truncate">{mode === 'login' ? 'Entrar no Sistema' : 'Criar minha Conta'}</span>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                className="text-primary text-sm font-bold hover:underline"
                            >
                                {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Clique para entrar'}
                            </button>
                        </div>


                    </div>
                </div>
            </main>
            <footer className="py-6 text-center text-muted text-xs">
                © 2024 ATJJ Dojo v4 Sistema de Gestão. Todos os direitos reservados.
            </footer>
        </div>
    );
}
