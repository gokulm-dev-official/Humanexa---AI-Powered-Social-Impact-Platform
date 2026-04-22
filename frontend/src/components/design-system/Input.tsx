import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, leftIcon, id, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const hasValue = props.value !== undefined && props.value !== '';
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full relative group">
                <div className={cn(
                    "relative flex items-center w-full h-14 rounded-xl border bg-white/50 backdrop-blur-sm transition-all duration-300",
                    error
                        ? "border-red-500 bg-red-50/10"
                        : isFocused
                            ? "border-sapphire ring-4 ring-sapphire/10 bg-white"
                            : "border-gray-200 hover:border-gray-300",
                    className
                )}>
                    {leftIcon && (
                        <div className="pl-4 text-gray-400">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full h-full bg-transparent px-4 pt-2 pb-0 outline-none text-primary-text font-medium transition-all placeholder:opacity-0 focus:placeholder:opacity-100",
                            leftIcon ? "pl-2" : "pl-4"
                        )}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        placeholder={label} // For screen readers / fallback
                        {...props}
                    />

                    {label && (
                        <label
                            htmlFor={inputId}
                            className={cn(
                                "absolute left-4 transition-all duration-200 pointer-events-none text-gray-500 origin-[0]",
                                (isFocused || hasValue || props.defaultValue)
                                    ? "top-2 text-xs font-semibold text-sapphire" // Floating state
                                    : "top-4 text-base" // Default state
                            )}
                        >
                            {label}
                        </label>
                    )}
                </div>

                {error && (
                    <p className="mt-1 text-sm text-red-500 font-medium animate-slide-up flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
