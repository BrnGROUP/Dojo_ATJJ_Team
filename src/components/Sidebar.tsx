
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/auth';
import { useSettings } from '../hooks/useSettings';

interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onClose }: SidebarProps) {
    const location = useLocation();
    const { profile, isAdmin, isManager } = useAuth();
    const { settings } = useSettings();

    // Close sidebar when route changes on mobile (< 768px)
    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const menuItems = [
        { label: 'Painel Geral', icon: 'dashboard', path: '/', roles: ['admin', 'manager', 'coordinator', 'instructor'] },
        { label: 'Meu Perfil', icon: 'person', path: `/members/${profile?.id}`, roles: ['student'] },
        { label: 'Membros & Equipe', icon: 'group', path: '/members', roles: ['admin', 'manager', 'coordinator', 'instructor'] },
        { label: 'Agenda de Aulas', icon: 'calendar_today', path: '/agenda' },
        { label: 'Turmas', icon: 'groups', path: '/groups', roles: ['admin', 'manager', 'coordinator', 'instructor'] },
        { label: 'Competições', icon: 'trophy', path: '/competitions' },
    ];

    const gamificationItems = [
        { label: 'Faixas & Graduação', icon: 'military_tech', path: '/belts', roles: ['admin', 'manager', 'coordinator', 'instructor'] },
        { label: 'Insígnias (Badges)', icon: 'workspace_premium', path: '/badges', roles: ['admin', 'manager', 'coordinator', 'instructor'] },
        { label: 'Ranking', icon: 'leaderboard', path: '/gamification/leaderboard' },
        { label: 'Minha Evolução', icon: 'monitoring', path: '/gamification/evolution' },
        { label: 'Currículo', icon: 'menu_book', path: '/gamification/curriculum' },
        { label: 'Graduação', icon: 'upgrade', path: '/gamification/graduation', roles: ['admin', 'manager', 'coordinator', 'instructor'] },
    ];

    const adminItems = [
        { label: 'Financeiro', icon: 'payments', path: '/finance', roles: ['admin', 'manager', 'coordinator'] },
        { label: 'Relatórios', icon: 'analytics', path: '/reports', roles: ['admin', 'manager', 'coordinator'] },
        { label: 'Configurações', icon: 'settings', path: '/settings', roles: ['admin'] },
    ];

    const filteredAdminItems = adminItems.filter(item =>
        !item.roles || (profile && item.roles.includes(profile.role))
    );

    // On mobile (<768px): sidebar is an overlay that slides in/out
    // On medium (768–1579px): sidebar is static, either icon-only (collapsed) or shown with text
    // On widescreen (≥1580px): sidebar is always static and full width
    const isMobileMode = typeof window !== 'undefined' && window.innerWidth < 768;

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const renderLink = (item: { label: string; icon: string; path: string }) => (
        <Link
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            title={isCollapsed ? item.label : undefined}
            className={cn(
                "flex items-center rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                isActive(item.path)
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted hover:bg-white/5 hover:text-white"
            )}
        >
            <span className={cn("material-symbols-outlined shrink-0", isActive(item.path) && "fill-current")}>
                {item.icon}
            </span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
            {/* Tooltip on collapsed mode */}
            {isCollapsed && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-card border border-border-slate text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                    {item.label}
                </span>
            )}
        </Link>
    );

    return (
        <>
            {/* Mobile Overlay - only below 768px */}
            {isOpen && isMobileMode && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                // Base styles
                "flex-shrink-0 bg-main flex flex-col h-full z-50 border-r border-border-slate transition-all duration-300",
                // Mobile: fixed overlay, slides in/out
                "fixed inset-y-0 left-0 md:static md:translate-x-0",
                // Width: collapsed = 72px, full = 280px
                isCollapsed ? "w-[72px]" : "w-[var(--sidebar-width)]",
                // Mobile open/close
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            )}>
                {/* Logo Area */}
                <div className={cn(
                    "flex items-center border-b border-border-slate shrink-0",
                    isCollapsed ? "justify-center p-4 h-[73px]" : "justify-between p-6 h-[73px]"
                )}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="bg-white rounded-lg p-1 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] shrink-0">
                                <img src="/logo.png" alt="ATJJ Logo" className="w-8 h-8 object-contain" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-white text-base font-extrabold tracking-tight leading-none uppercase truncate">
                                    {settings.dojo_name}
                                </h1>
                                <p className="text-muted text-[9px] font-bold tracking-[0.2em] mt-0.5">SISTEMA V4</p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="bg-white rounded-lg p-1 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <img src="/logo.png" alt="ATJJ Logo" className="w-8 h-8 object-contain" />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {!isCollapsed && (
                        <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-widest mb-2 opacity-50">Geral</p>
                    )}
                    {isCollapsed && <div className="h-4" />}

                    {menuItems
                        .filter(item => !item.roles || item.roles.includes(profile?.role ?? ''))
                        .map(renderLink)}

                    {!isCollapsed && (
                        <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-widest mb-2 mt-6 opacity-50">Gamificação</p>
                    )}
                    {isCollapsed && <div className="h-4 border-t border-border-slate/30 mt-2" />}

                    {gamificationItems
                        .filter(item => !item.roles || item.roles.includes(profile?.role ?? ''))
                        .map(renderLink)}

                    {filteredAdminItems.length > 0 && (
                        <>
                            {!isCollapsed && (
                                <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-widest mb-2 mt-6 opacity-50">Administrativo</p>
                            )}
                            {isCollapsed && <div className="h-4 border-t border-border-slate/30 mt-2" />}
                            {filteredAdminItems.map(renderLink)}
                        </>
                    )}
                </nav>

                {/* Bottom Card (only when not collapsed) */}
                {!isCollapsed && (isAdmin || isManager) && (
                    <div className="p-4 border-t border-border-slate shrink-0">
                        <div className="bg-card rounded-2xl p-4 border border-border-slate">
                            <p className="text-[11px] font-medium text-muted mb-2">Plano Premium</p>
                            <div className="h-1.5 w-full bg-main rounded-full mb-3">
                                <div className="h-full bg-primary w-2/3 rounded-full shadow-[0_0_10px_rgba(215,38,56,0.5)]"></div>
                            </div>
                            <button className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-wider transition-colors">Ver detalhes</button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
