import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, ClipboardList, Package, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/authStore';

const PharmacistLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const tabs = [
        { path: '/pharmacist/scan', icon: QrCode, label: 'Scan' },
        { path: '/pharmacist/stock', icon: Package, label: 'Stock' },
        { path: '/pharmacist/history', icon: ClipboardList, label: 'History' },
        { path: '/pharmacist/profile', icon: User, label: 'Profile' },
    ];

    const getActiveTab = (path) => {
        if (location.pathname.includes('/pharmacist/dispense')) return '/pharmacist/scan';
        return path;
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Top Bar - Minimal */}
            <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Logo size="sm" />
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">{user?.name || 'MedPlus Pharmacy'}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Pharmacy'}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center h-16">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = getActiveTab(tab.path) === tab.path || location.pathname === tab.path;

                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{tab.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default PharmacistLayout;
