import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    className,
    disabled,
    ...props
}) => {
    const baseStyles = "px-6 py-3 rounded-xl font-bold transition duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-cyan-500/20",
        secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-lg shadow-purple-500/20",
        outline: "border-2 border-slate-600 text-slate-300 hover:border-white hover:text-white bg-transparent",
        ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5"
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />}
            {children}
        </button>
    );
};
