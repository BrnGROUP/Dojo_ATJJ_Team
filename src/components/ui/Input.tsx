import { cn } from '../../lib/utils';
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: string;
}

export function Input({
    className,
    label,
    error,
    icon,
    id,
    ...props
}: InputProps) {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label htmlFor={id} className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                        {icon}
                    </span>
                )}
                <input
                    id={id}
                    className={cn(
                        'w-full bg-main border border-border-slate rounded-xl py-3 px-4 text-white text-sm outline-none transition-all duration-300',
                        'focus:border-primary focus:ring-1 focus:ring-primary/30',
                        'placeholder:text-slate-600',
                        icon && 'pl-12',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-red-500 text-[10px] font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
}
