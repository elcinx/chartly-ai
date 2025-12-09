import React from 'react';
import { clsx } from 'clsx';

interface SectionTitleProps {
    number: string;
    title: string;
    colorClass?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ number, title, colorClass = "border-primary" }) => {
    return (
        <h2 className={clsx("text-2xl font-bold text-white pl-4 border-l-4 mb-6", colorClass)}>
            <span className="opacity-50 mr-2">{number}.</span>
            {title}
        </h2>
    );
};
