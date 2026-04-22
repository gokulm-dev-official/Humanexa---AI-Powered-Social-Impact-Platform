import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'sapphire' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
    icon?: React.ReactNode;
}

export const Badge = ({ className, variant = 'neutral', size = 'md', dot, icon, children, ...props }: BadgeProps) => {
    const variants = {
        success: "bg-success/10 text-success-600 border border-success/10",
        warning: "bg-warning/10 text-warning-600 border border-warning/10",
        error: "bg-danger/10 text-danger-600 border border-danger/10",
        info: "bg-accent/8 text-accent border border-accent/10",
        neutral: "bg-black/[0.04] text-secondary-text border border-transparent",
        sapphire: "bg-accent/8 text-accent border border-accent/10",
        accent: "bg-accent/8 text-accent border border-accent/10",
    };

    const sizes = {
        sm: "px-2 py-[2px] text-[10px]",
        md: "px-2.5 py-[3px] text-[11px]",
        lg: "px-3 py-1 text-[12px]",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-medium leading-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {dot && (
                <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    variant === 'success' && "bg-success",
                    variant === 'warning' && "bg-warning",
                    variant === 'error' && "bg-danger",
                    variant === 'info' && "bg-accent",
                    variant === 'neutral' && "bg-secondary-text/40",
                    (variant === 'sapphire' || variant === 'accent') && "bg-accent",
                )} />
            )}
            {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
            {children}
        </span>
    );
};
