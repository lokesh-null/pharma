import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/authStore';

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login but save the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // If role is not allowed, redirect to their own dashboard
        const roleRoutes = {
            'ADMIN': '/doctor/dashboard',
            'NURSE': '/doctor/dashboard',
            'PHARMACY': '/pharmacist/scan'
        };
        const fallback = roleRoutes[user.role] || '/login';
        return <Navigate to={fallback} replace />;
    }

    return children;
};
