import { cn } from '../lib/utils';

interface LeaderboardCardProps {
    position: number;
    memberName: string;
    value: number;
    valueLabel: string;
    belt?: string;
    isPodium?: boolean;
}

export function LeaderboardCard({ position, memberName, value, valueLabel, belt, isPodium = false }: LeaderboardCardProps) {

    const getMedalIcon = (pos: number) => {
        if (pos === 1) return '🥇';
        if (pos === 2) return '🥈';
        if (pos === 3) return '🥉';
        return null;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg",
            isPodium
                ? "bg-gradient-to-r from-primary/10 to-transparent border-primary/30 shadow-lg shadow-primary/5"
                : "bg-card border-border-slate hover:border-primary/20"
        )}>
            {/* Position */}
            <div className={cn(
                "flex items-center justify-center shrink-0",
                isPodium ? "w-16 h-16" : "w-12 h-12"
            )}>
                {getMedalIcon(position) ? (
                    <div className="text-center">
                        <div className={cn("text-4xl", isPodium && "animate-pulse")}>{getMedalIcon(position)}</div>
                    </div>
                ) : (
                    <div className={cn(
                        "w-full h-full rounded-xl bg-main border border-border-slate flex items-center justify-center",
                        "text-lg font-black text-muted"
                    )}>
                        #{position}
                    </div>
                )}
            </div>

            {/* Avatar */}
            <div className={cn(
                "rounded-full bg-primary/20 flex items-center justify-center text-primary font-black shrink-0",
                isPodium ? "w-14 h-14 text-lg" : "w-12 h-12 text-sm"
            )}>
                {getInitials(memberName)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className={cn(
                    "font-bold text-white truncate",
                    isPodium ? "text-lg" : "text-base"
                )}>
                    {memberName}
                </h3>
                {belt && (
                    <p className="text-xs text-muted truncate">{belt}</p>
                )}
            </div>

            {/* Value */}
            <div className="text-right shrink-0">
                <p className={cn(
                    "font-black",
                    isPodium ? "text-2xl text-primary" : "text-xl text-white"
                )}>
                    {value.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted uppercase tracking-wider">{valueLabel}</p>
            </div>
        </div>
    );
}
