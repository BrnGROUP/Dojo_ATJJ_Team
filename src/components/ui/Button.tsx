import { cn } from '../../lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98]',
        secondary: 'bg-secondary text-white shadow-lg shadow-secondary/20 hover:brightness-110 active:scale-[0.98]',
        outline: 'bg-transparent border border-border-slate text-white hover:bg-white/5 active:scale-[0.98]',
        ghost: 'bg-transparent text-muted hover:text-white hover:bg-white/5',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98]',
    };

    const sizes = {
        sm: 'h-9 px-3 text-xs',
        md: 'h-12 px-6 text-sm',
        lg: 'h-14 px-8 text-base',
    };

    return (
        <button
            disabled={disabled || loading}
            className={cn(
                'flex items-center justify-center rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-primary/50',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {loading ? (
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            ) : icon ? (
                <span className="mr-2 flex items-center">{icon}</span>
            ) : null}
            {children}
        </button>
    );
}
