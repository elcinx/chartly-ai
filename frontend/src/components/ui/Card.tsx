import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={twMerge(
                "bg-surface/40 backdrop-blur-md border border-white/10 rounded-[20px] p-6md:p-8 shadow-xl",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
