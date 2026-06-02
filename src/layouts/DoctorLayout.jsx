import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Bell, QrCode, ClipboardList, UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/authStore';

const DoctorHeader = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 w-full glass-header px-6 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="flex items-center gap-3">
                <Logo size="sm" />
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-teal-700">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                </Button>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">{user?.name || 'Dr. Sharma'}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'General Physician'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Doctor'}`} alt="Doc" />
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                <Button variant="ghost" size="icon" className="hidden sm:flex text-slate-400 hover:text-red-600" onClick={handleLogout} title="Logout">
                    <LogOut size={20} />
                </Button>
            </div>
        </header>
    );
};

const DoctorLayout = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        { icon: QrCode, label: 'Scan QR', path: '/doctor/scan' },
        { icon: ClipboardList, label: 'Activity Log', path: '/doctor/activity' },
        { icon: UserCircle, label: 'Profile', path: '/doctor/profile' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <DoctorHeader />
            <main className="max-w-md mx-auto min-h-[calc(100vh-140px)]">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-2 pb-6 z-50 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path || (item.path === '/doctor/scan' && currentPath === '/doctor/dashboard');

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className="flex flex-col items-center gap-1 min-w-[64px]"
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                isActive ? "bg-teal-50 text-teal-700 translate-y-[-4px] shadow-sm" : "text-slate-400 hover:bg-slate-50"
                            )}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-teal-700" : "text-slate-400"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default DoctorLayout;
