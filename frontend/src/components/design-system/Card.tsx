import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'elevated' | 'outlined';
    hoverEffect?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hoverEffect = true, padding = 'none', children, ...props }, ref) => {

        const baseStyles = "rounded-2xl transition-all duration-400 ease-apple";

        const variants = {
            default: "bg-white border border-black/[0.04] shadow-soft-sm",
            glass: "bg-white/70 backdrop-blur-xl border border-white/50 shadow-soft-sm",
            elevated: "bg-white border border-black/[0.04] shadow-soft-md",
            outlined: "bg-white border border-black/[0.08]",
        };

        const paddings = {
            none: "",
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        };

        const hoverStyles = hoverEffect
            ? "hover:shadow-card-hover hover:-translate-y-[2px]"
            : "";

        return (
            <div
                ref={ref}
                className={cn(baseStyles, variants[variant], paddings[padding], hoverStyles, className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-6 pt-6 pb-2", className)} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-title-3 text-primary-text", className)} {...props}>
        {children}
    </h3>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-6 pb-6 pt-1", className)} {...props}>
        {children}
    </div>
);
