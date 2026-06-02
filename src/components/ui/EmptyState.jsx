import React from 'react';
import { FolderSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EmptyState = ({ 
    icon: Icon = FolderSearch, 
    title = 'No Data Found', 
    description = 'There is nothing to display here at the moment.',
    action = null,
    className
}) => {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-dashed border-slate-200 rounded-2xl bg-slate-50/50", className)}>
            <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-800">{title}</h3>
            <p className="mb-6 max-w-sm text-sm text-slate-500">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
};
