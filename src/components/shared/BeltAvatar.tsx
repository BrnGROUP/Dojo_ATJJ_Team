
import { cn } from '../../lib/utils';
import { getBeltColor, getBeltGlow, getInitials } from '../../lib/ui-utils';

interface BeltAvatarProps {
    name: string;
    belt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showGlow?: boolean;
}

export function BeltAvatar({ name, belt, size = 'md', className, showGlow = true }: BeltAvatarProps) {
    const initials = getInitials(name);
    const colorClass = getBeltColor(belt);
    const glowClass = showGlow ? getBeltGlow(belt) : '';

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-base',
        xl: 'w-20 h-20 text-2xl',
    };

    return (
        <div className={cn(
            "rounded-full flex items-center justify-center bg-zinc-800 text-white font-black shrink-0 transition-all",
            sizeClasses[size],
            glowClass,
            className
        )}>
            <span className={cn(colorClass)}>{initials}</span>
        </div>
    );
}
