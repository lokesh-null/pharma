import { create } from 'zustand';

let toastCount = 0;

export const useToastStore = create((set) => ({
    toasts: [],
    
    addToast: (toast) => {
        const id = `toast-${toastCount++}`;
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }]
        }));
        
        // Auto remove
        if (toast.duration !== Infinity) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id)
                }));
            }, toast.duration || 3000);
        }
    },
    
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    })),
}));

export const toast = {
    success: (message, options = {}) => useToastStore.getState().addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => useToastStore.getState().addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => useToastStore.getState().addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => useToastStore.getState().addToast({ type: 'info', message, ...options }),
};
