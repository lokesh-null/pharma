import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)}
            {...props}
        />
    );
};

export const PageLoader = () => {
    return (
        <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600"></div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Loading module...</p>
            </div>
        </div>
    );
};
