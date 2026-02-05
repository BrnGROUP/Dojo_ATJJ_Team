
import { cn } from '../../lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: string;
    trendType?: 'positive' | 'negative' | 'neutral';
    className?: string;
}

export function StatCard({ label, value, trend, trendType = 'positive', className }: StatCardProps) {
    return (
        <div className={cn("dashboard-card p-6 rounded-2xl flex flex-col justify-between bg-card", className)}>
            <div className="flex justify-between items-start mb-6">
                <p className="text-muted text-xs font-semibold uppercase tracking-wider">{label}</p>
                <div className="sparkline rounded opacity-50"></div>
            </div>
            <div className="flex items-end justify-between">
                <h3 className="text-3xl font-extrabold text-white">{value}</h3>
                {trend && (
                    <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-md",
                        trendType === 'positive' && "text-primary bg-primary/10",
                        trendType === 'neutral' && "text-muted bg-white/5",
                        trendType === 'negative' && "text-red-500 bg-red-500/10"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
