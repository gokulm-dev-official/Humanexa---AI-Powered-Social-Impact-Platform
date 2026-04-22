import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, ...props }, ref) => {

        const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 ease-apple active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 group font-sans";

        const variants = {
            primary: "bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow-md",
            secondary: "bg-black/[0.04] text-primary-text hover:bg-black/[0.08] border border-transparent",
            ghost: "bg-transparent text-secondary-text hover:text-primary-text hover:bg-black/[0.04]",
            danger: "bg-danger text-white hover:bg-danger-600 shadow-sm",
            success: "bg-success text-white hover:bg-success-600 shadow-sm",
        };

        const sizes = {
            sm: "h-8 px-3.5 text-[13px] rounded-lg gap-1.5",
            md: "h-10 px-5 text-[14px] rounded-[10px] gap-2",
            lg: "h-12 px-7 text-[15px] rounded-xl gap-2",
            icon: "h-10 w-10 rounded-[10px] flex items-center justify-center p-0",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    </div>
                )}
                <span className={cn("flex items-center gap-2", isLoading && "opacity-0")}>
                    {leftIcon && <span className="transition-transform duration-200 ease-apple">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="transition-transform duration-200 ease-apple group-hover:translate-x-0.5">{rightIcon}</span>}
                </span>
            </button>
        );
    }
);

Button.displayName = 'Button';
