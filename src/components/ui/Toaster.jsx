import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/lib/toast';

const toastConfig = {
    success: { icon: CheckCircle, className: 'bg-teal-50 text-teal-900 border-teal-200', iconClass: 'text-teal-600' },
    error: { icon: AlertCircle, className: 'bg-red-50 text-red-900 border-red-200', iconClass: 'text-red-600' },
    warning: { icon: AlertTriangle, className: 'bg-amber-50 text-amber-900 border-amber-200', iconClass: 'text-amber-600' },
    info: { icon: Info, className: 'bg-blue-50 text-blue-900 border-blue-200', iconClass: 'text-blue-600' },
};

export const Toaster = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none sm:px-0 sm:right-6 sm:top-6">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const config = toastConfig[toast.type] || toastConfig.info;
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${config.className}`}
                            layout
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${config.iconClass}`} />
                            <div className="flex-1 text-sm font-medium pt-0.5">
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className={`shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors ${config.iconClass}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
