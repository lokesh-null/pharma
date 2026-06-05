import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Bell, QrCode, ClipboardList, UserCircle, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/authStore';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorHeader = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 w-full glass-header px-6 py-3 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <Logo size="sm" />
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
                </Button>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.fullName || 'Dr. Sharma'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.toLowerCase() || 'General Physician'}</p>
                    </div>
                    
                    {/* Avatar - Clickable Dropdown Trigger */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName || 'Doctor'}`} alt="Doc" className="h-full w-full object-cover" />
                        </button>

                        {/* Profile Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <div className="absolute top-12 right-0 w-56 z-50">
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="relative z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden py-1"
                                    >
                                        {/* Theme Toggle */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTheme();
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group"
                                        >
                                            <span className="flex items-center gap-3">
                                                {theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-orange-400" />}
                                                Appearance
                                            </span>

                                            {/* Visual Switch */}
                                            <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-teal-600' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white dark:bg-slate-200 transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </button>

                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                                        {/* Sign Out */}
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <DoctorHeader />
            <main className="max-w-md mx-auto min-h-[calc(100vh-140px)]">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 pb-6 z-50 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
                                isActive ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 translate-y-[-4px] shadow-sm" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-teal-700 dark:text-teal-400" : "text-slate-400"
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
