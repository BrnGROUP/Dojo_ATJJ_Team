import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { fetchMemberBadges } from '../../hooks/useBadgeEngine';

interface BadgeShowcaseProps {
    memberId: string;
    compact?: boolean;
}

interface EarnedBadge {
    id: string;
    badge_id: string;
    awarded_at: string;
    awarded_by: string | null;
    awarded_note: string | null;
    badge: {
        id: string;
        name: string;
        description: string;
        category: string;
        level: string;
        icon: string;
        xp_reward: number;
        badge_group: string | null;
    };
}

export function BadgeShowcase({ memberId, compact = false }: BadgeShowcaseProps) {
    const [badges, setBadges] = useState<EarnedBadge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null);

    useEffect(() => {
        if (!memberId) return;
        setLoading(true);
        fetchMemberBadges(memberId).then((data) => {
            setBadges(data as EarnedBadge[]);
            setLoading(false);
        });
    }, [memberId]);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Bronze': return 'text-[#CD7F32] bg-[#CD7F32]/10 border-[#CD7F32]/30';
            case 'Prata': return 'text-[#C0C0C0] bg-[#C0C0C0]/10 border-[#C0C0C0]/30';
            case 'Ouro': return 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/30';
            case 'Diamante': return 'text-[#B9F2FF] bg-[#B9F2FF]/15 border-[#B9F2FF]/40';
            default: return 'text-white bg-white/10 border-white/20';
        }
    };

    const getLevelGlow = (level: string) => {
        switch (level) {
            case 'Ouro': return 'shadow-[0_0_12px_rgba(255,215,0,0.25)]';
            case 'Diamante': return 'shadow-[0_0_18px_rgba(185,242,255,0.35)] animate-pulse';
            default: return '';
        }
    };

    const getLevelEmoji = (level: string) => {
        switch (level) {
            case 'Bronze': return '🥉';
            case 'Prata': return '🥈';
            case 'Ouro': return '🥇';
            case 'Diamante': return '💎';
            default: return '🏅';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (badges.length === 0) {
        return (
            <div className={cn("text-center", compact ? "py-4" : "py-8")}>
                <span className="material-symbols-outlined text-3xl text-muted/20 mb-2 block">workspace_premium</span>
                <p className="text-muted text-xs font-bold uppercase tracking-widest">Nenhuma insígnia conquistada</p>
            </div>
        );
    }

    // Sort by level importance (Diamante first)
    const levelOrder: Record<string, number> = { 'Diamante': 0, 'Ouro': 1, 'Prata': 2, 'Bronze': 3 };
    const sortedBadges = [...badges].sort(
        (a, b) => (levelOrder[a.badge?.level] ?? 4) - (levelOrder[b.badge?.level] ?? 4)
    );

    return (
        <div className="space-y-4">
            {!compact && (
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FFD700]">workspace_premium</span>
                    <h3 className="text-white font-black uppercase tracking-tight text-lg">
                        Conquistas
                    </h3>
                    <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {badges.length}
                    </span>
                </div>
            )}

            <div className={cn(
                "grid gap-3",
                compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            )}>
                {sortedBadges.map(earned => (
                    <button
                        key={earned.id}
                        onClick={() => setSelectedBadge(earned)}
                        className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all hover:scale-105 cursor-pointer group",
                            getLevelColor(earned.badge?.level),
                            getLevelGlow(earned.badge?.level)
                        )}
                        title={earned.badge?.name}
                    >
                        <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">
                            {earned.badge?.icon || 'workspace_premium'}
                        </span>
                        {!compact && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-center leading-tight line-clamp-2">
                                {earned.badge?.name}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Badge Detail Modal */}
            {selectedBadge && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedBadge(null)}>
                    <div className="bg-card w-full max-w-sm rounded-3xl border border-border-slate shadow-2xl p-8 text-center space-y-4" onClick={e => e.stopPropagation()}>
                        <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center border-2 mx-auto",
                            getLevelColor(selectedBadge.badge?.level),
                            getLevelGlow(selectedBadge.badge?.level)
                        )}>
                            <span className="material-symbols-outlined text-[48px]">{selectedBadge.badge?.icon}</span>
                        </div>

                        <div>
                            <h3 className="text-xl font-black text-white uppercase">{selectedBadge.badge?.name}</h3>
                            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase border inline-block mt-1", getLevelColor(selectedBadge.badge?.level))}>
                                {getLevelEmoji(selectedBadge.badge?.level)} {selectedBadge.badge?.level}
                            </span>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed">{selectedBadge.badge?.description}</p>

                        <div className="flex justify-center gap-3 flex-wrap">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                                +{selectedBadge.badge?.xp_reward} XP
                            </span>
                        </div>

                        <div className="border-t border-border-slate pt-4 space-y-1">
                            <p className="text-[10px] text-muted">
                                Conquistada em {new Date(selectedBadge.awarded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            {selectedBadge.awarded_note && (
                                <p className="text-[10px] text-muted italic">"{selectedBadge.awarded_note}"</p>
                            )}
                            <p className="text-[9px] text-muted/50">
                                {selectedBadge.awarded_by ? 'Outorgada por instrutor' : 'Conquista automática'}
                            </p>
                        </div>

                        <button onClick={() => setSelectedBadge(null)} className="px-6 py-2 bg-white/5 rounded-xl text-white font-bold text-sm hover:bg-white/10 transition-colors">
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
