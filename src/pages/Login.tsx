import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { useSettings } from '../hooks/useSettings';
import { cn } from '../lib/utils';

export function Login() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { signIn, signUp } = useAuth();
    const { settings } = useSettings();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { error } = await signIn(email, password);
                if (error) throw error;
                toast.success('Bem-vindo de volta!');
            } else {
                const { error } = await signUp(email, password, fullName);
                if (error) throw error;
                toast.success('Conta criada com sucesso!');
                setMode('login');
            }
            navigate('/');
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Auth error:', error);
            setError(error.message || 'Erro na autenticação');
            toast.error(error.message || 'Erro na autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-main overflow-hidden">
            <main className="flex-1 flex flex-col md:flex-row">
                {/* Left side: Branding */}
                <div className="hidden md:flex flex-col justify-between w-1/2 p-20 relative overflow-hidden bg-card border-r border-border-slate">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-16 animate-fade-in">
                            <div className="bg-white rounded-2xl p-2 shadow-2xl">
                                <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-4xl font-black uppercase tracking-tighter italic leading-none">
                                    {settings.dojo_name}
                                </h1>
                                <p className="text-muted text-xs font-bold tracking-[0.3em] mt-2">DASHIBOARD V4</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter uppercase italic">
                                Domine o <br />
                                <span className="text-primary">Tatame</span> Digitall
                            </h2>
                            <p className="text-muted text-lg font-medium max-w-md leading-relaxed">
                                A plataforma completa de gestão ATJJ para mestres e alunos que buscam a excelência técnica e operacional.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex gap-12">
                        <div>
                            <p className="text-white text-3xl font-black italic">+520</p>
                            <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Alunos Ativos</p>
                        </div>
                        <div>
                            <p className="text-white text-3xl font-black italic">100%</p>
                            <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Cloud Native</p>
                        </div>
                    </div>
                </div>

                {/* Right side: Login Form */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-20 relative">
                    <div className="md:hidden absolute top-10 flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                        <h1 className="text-white text-xl font-black uppercase italic tracking-tighter">{settings.dojo_name}</h1>
                    </div>

                    <div className="w-full max-w-[420px] animate-in slide-in-from-bottom-8 duration-700">
                        <div className="mb-10">
                            <h3 className="text-white text-3xl font-black leading-none tracking-tight mb-3 italic uppercase">
                                {mode === 'login' ? 'Identifique-se' : 'Crie sua Conta'}
                            </h3>
                            <p className="text-muted font-medium">
                                {mode === 'login'
                                    ? 'Acesse o Dojo utilizando suas credenciais administrativas.'
                                    : 'Preencha os dados abaixo para solicitar seu acesso administrativo.'}
                            </p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-6">
                            {mode === 'signup' && (
                                <div className="space-y-2">
                                    <label className="text-white text-xs font-bold uppercase tracking-wider ml-1">Nome Completo</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xl transition-colors group-focus-within:text-primary">person</span>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full h-14 bg-card border border-border-slate rounded-2xl pl-12 pr-4 text-white font-bold outline-none focus:border-primary transition-all"
                                            placeholder="Seu nome completo"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-white text-xs font-bold uppercase tracking-wider ml-1">E-mail Corporativo</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xl transition-colors group-focus-within:text-primary">mail</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-14 bg-card border border-border-slate rounded-2xl pl-12 pr-4 text-white font-bold outline-none focus:border-primary transition-all tabular-nums"
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-white text-xs font-bold uppercase tracking-wider">Senha de Acesso</label>
                                    {mode === 'login' && <button type="button" className="text-primary text-[10px] font-black uppercase hover:brightness-125">Esqueci a senha</button>}
                                </div>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xl transition-colors group-focus-within:text-primary">lock</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 bg-card border border-border-slate rounded-2xl pl-12 pr-4 text-white font-bold outline-none focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold animate-shake">{error}</div>}

                            <div className="pt-4">
                                <button
                                    className={cn(
                                        "w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3",
                                        loading && "opacity-70 pointer-events-none"
                                    )}
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

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                className="text-muted text-xs font-medium hover:text-white transition-colors"
                            >
                                {mode === 'login' ? (
                                    <>Ainda não tem acesso? <span className="text-primary font-bold">Solicite aqui</span></>
                                ) : (
                                    <>Já possui credenciais? <span className="text-primary font-bold">Voltar ao login</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="py-6 text-center text-muted text-[10px] font-bold tracking-widest uppercase opacity-40">
                © {new Date().getFullYear()} {settings.dojo_name} • Cloud Management V4
            </footer>
        </div>
    );
}
