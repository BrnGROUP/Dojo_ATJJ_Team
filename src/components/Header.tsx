import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { toast } from 'react-hot-toast';
import { BeltAvatar } from './shared/BeltAvatar';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { profile, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Sessão encerrada.');
        } catch {
            toast.error('Erro ao sair.');
        }
    };

    return (
        <header className="h-18 flex items-center justify-between bg-main/95 backdrop-blur-md border-b border-border-slate px-4 md:px-10 sticky top-0 z-30 py-4">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="relative w-full max-w-md group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">search</span>
                    <input className="w-full bg-card border border-border-slate rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted/50" placeholder="Pesquisar por alunos, graduações..." type="text" />
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex gap-1 md:gap-2">
                    <button className="p-2 text-muted hover:text-white hover:bg-card rounded-xl transition-all relative">
                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-main shadow-[0_0_8px_#d72638]"></span>
                    </button>
                </div>
                <div className="h-8 w-px bg-border-slate hidden sm:block"></div>

                <div className="flex items-center gap-2 md:gap-3 pl-2 group relative">
                    <Link
                        to={profile?.id ? `/users/${profile.id}` : '#'}
                        className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-all cursor-pointer"
                    >
                        <div className="flex flex-col text-right">
                            <span className="text-white text-xs md:text-sm font-black leading-none italic uppercase tracking-tighter">
                                {(profile?.full_name || 'Usuário').trim().split(/\s+/).slice(0, 2).join(' ')}
                            </span>
                            <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">
                                {profile?.role === 'admin' ? 'Administrador' : 
                                 profile?.role === 'manager' ? 'Gestor' : 
                                 profile?.role === 'coordinator' ? 'Coordenador' : 
                                 profile?.role === 'instructor' ? 'Instrutor' : 'Membro'}
                            </span>
                        </div>

                        <div className="relative">
                            <BeltAvatar
                                name={(profile?.member as any)?.full_name || profile?.full_name || 'Usuário'}
                                belt={(profile?.member as any)?.belt || 'Branca'}
                                avatarUrl={(profile?.member as any)?.avatar_url || profile?.avatar_url}
                                size="md"
                                showGlow={false}
                                className="border-border-slate hover:border-primary transition-all duration-300 rounded-xl"
                            />
                        </div>
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className="p-2 text-muted hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all ml-2"
                        title="Sair do Sistema"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

