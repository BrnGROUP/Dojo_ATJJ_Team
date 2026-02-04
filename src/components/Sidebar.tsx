import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();

    // Close sidebar when route changes on mobile
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const menuItems = [
        { label: 'Painel Geral', icon: 'dashboard', path: '/' },
        { label: 'Membros', icon: 'group', path: '/members' },
        { label: 'Agenda de Aulas', icon: 'calendar_today', path: '/agenda' },
        { label: 'Turmas', icon: 'groups', path: '/groups' },
        { label: 'Competições', icon: 'trophy', path: '/competitions' },
    ];

    const gamificationItems = [
        { label: 'Faixas & Graduação', icon: 'military_tech', path: '/belts' },
        { label: 'Insígnias (Badges)', icon: 'workspace_premium', path: '/badges' },
        { label: 'Ranking', icon: 'trophy', path: '/gamification/leaderboard' },
        { label: 'Evolução', icon: 'monitoring', path: '/gamification/evolution' },
        { label: 'Currículo', icon: 'menu_book', path: '/gamification/curriculum' },
        { label: 'Graduação', icon: 'upgrade', path: '/gamification/graduation' },
    ];

    const adminItems = [
        { label: 'Financeiro', icon: 'payments', path: '/finance' },
        { label: 'Relatórios', icon: 'analytics', path: '/reports' },
        { label: 'Configurações', icon: 'settings', path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed md:static inset-y-0 left-0 w-[var(--sidebar-width)] flex-shrink-0 bg-main flex flex-col h-full z-50 border-r border-border-slate transition-transform duration-300 transform md:transform-none",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-lg p-1 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <img src="/logo.png" alt="ATJJ Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-white text-xl font-extrabold tracking-tight leading-none uppercase">ATJJ Dojo</h1>
                            <p className="text-muted text-[10px] font-bold tracking-[0.2em] mt-1">SISTEMA V4</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-widest mb-4 opacity-50">Geral</p>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={cn(
                                "sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                location.pathname === item.path
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : "text-muted hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className={cn("material-symbols-outlined", location.pathname === item.path && "fill-current")}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}

                    <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-widest mb-4 mt-8 opacity-50">Gamificação</p>
                    {gamificationItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={cn(
                                "sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : "text-muted hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className={cn("material-symbols-outlined", (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) && "fill-current")}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}

                    <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-widest mb-4 mt-8 opacity-50">Administrativo</p>
                    {adminItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={cn(
                                "sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                location.pathname === item.path
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : "text-muted hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className={cn("material-symbols-outlined", location.pathname === item.path && "fill-current")}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-6 border-t border-border-slate">
                    <div className="bg-card rounded-2xl p-4 border border-border-slate">
                        <p className="text-[11px] font-medium text-muted mb-2">Plano Premium</p>
                        <div className="h-1.5 w-full bg-main rounded-full mb-3">
                            <div className="h-full bg-primary w-2/3 rounded-full shadow-[0_0_10px_rgba(215,38,56,0.5)]"></div>
                        </div>
                        <button className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-wider transition-colors">Ver detalhes</button>
                    </div>
                </div>
            </aside>
        </>
    );
}
