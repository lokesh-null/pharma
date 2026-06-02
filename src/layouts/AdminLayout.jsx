import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, LogOut, ShieldCheck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/authStore';

const AdminHeader = () => {
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
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase hidden sm:inline-block">Admin</span>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-teal-700">
                    <Bell size={20} />
                </Button>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Administrator'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm flex items-center justify-center text-slate-500">
                        <ShieldCheck size={24} />
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

const AdminLayout = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Activity, label: 'Audit Log', path: '/admin/audit' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <AdminHeader />
            
            <div className="flex flex-1">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 shrink-0">
                    <nav className="flex-1 space-y-2 mt-4">
                        {navItems.map((item) => {
                            const isActive = currentPath === item.path || (item.path === '/admin/dashboard' && currentPath === '/admin');
                            
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium",
                                        isActive 
                                            ? "bg-teal-50 text-teal-700 shadow-sm" 
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-2 pb-6 z-50 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path || (item.path === '/admin/dashboard' && currentPath === '/admin');

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

export default AdminLayout;
