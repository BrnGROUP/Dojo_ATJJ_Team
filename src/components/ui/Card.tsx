import { cn } from '../../lib/utils';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
    variant?: 'glass' | 'solid';
}

export function Card({
    className,
    children,
    hover = true,
    variant = 'solid',
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-border-slate overflow-hidden transition-all duration-300',
                variant === 'solid' ? 'bg-card' : 'bg-white/5 backdrop-blur-md border-white/10',
                hover && 'hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-6 border-b border-border-slate', className)} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-6', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-6 border-t border-border-slate bg-black/5', className)} {...props}>
            {children}
        </div>
    );
}
