import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, X, Clock, AlertTriangle, CheckCircle2, History, Moon, Sun, FileHeart, ChevronDown, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

import Logo from '@/components/ui/Logo';
import MedicalHistoryModal from './components/MedicalHistoryModal';
import { useAuthStore } from '@/lib/authStore';

const ConsentLogsModal = ({ isOpen, onClose }) => {
    // Removed mock data for consent logs
    const [activeSessions, setActiveSessions] = useState([]);

    const history = [];

    const revokeAccess = (id) => {
        setActiveSessions(prev => prev.filter(s => s.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] border border-slate-200 dark:border-slate-800"
            >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-teal-600 dark:text-teal-500" /> Consent Logs
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Active Sessions */}
                    <section>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Access
                        </h4>

                        {activeSessions.length > 0 ? (
                            activeSessions.map(session => (
                                <div key={session.id} className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{session.doctor}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{session.hospital}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-[10px]">
                                            Active
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-3 bg-white/60 dark:bg-slate-800/60 p-2 rounded-lg">
                                        <Clock size={14} />
                                        <span>{session.start} - {session.end}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="w-full h-8 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 shadow-none"
                                        onClick={() => revokeAccess(session.id)}
                                    >
                                        Revoke Access
                                    </Button>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                                        Auto-revokes at {session.end}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-xs text-slate-400 dark:text-slate-500">No active access sessions.</p>
                            </div>
                        )}
                    </section>

                    {/* History */}
                    <section>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">History</h4>
                        <div className="space-y-3">
                            {history.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{item.doctor || item.pharmacist}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.date} • {item.duration}</p>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};

const ProfileHeader = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [showConsentLogs, setShowConsentLogs] = useState(false);
    const [showMedicalHistory, setShowMedicalHistory] = useState(false);

    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const firstName = user?.fullName?.split(' ')[0] || 'Patient';

    return (
        <>
            <header className="sticky top-0 z-40 w-full glass-header px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Logo for brand identity */}
                    <div className="sm:hidden">
                        <Logo variant="icon-only" size="sm" />
                    </div>
                    <div className="hidden sm:block">
                        <Logo size="sm" />
                    </div>

                    {/* Greeting */}
                    <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 ml-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Welcome</span>
                        <span className="text-sm font-bold text-teal-900 dark:text-teal-100 leading-none">{firstName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Verification Badge */}
                    <Badge variant="success" className="gap-1 hidden sm:flex bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <ShieldCheck size={12} />
                        <span>Aadhaar Verified</span>
                    </Badge>
                    {/* Mobile Badge version (icon only) */}
                    <div className="sm:hidden text-medical-green dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                        <ShieldCheck size={16} />
                    </div>

                    {/* Avatar - Clickable Dropdown Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-teal-100 dark:ring-teal-900 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                            <img
                                src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
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
                                                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </button>

                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                                        {/* Consent Logs */}
                                        <button
                                            onClick={() => { setShowConsentLogs(true); setShowMenu(false); }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                                        >
                                            <ShieldCheck size={16} className="text-teal-500" />
                                            Consent Logs
                                        </button>

                                        {/* Medical History */}
                                        <button
                                            onClick={() => { setShowMedicalHistory(true); setShowMenu(false); }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                                        >
                                            <FileHeart size={16} className="text-rose-500" />
                                            Medical History
                                        </button>

                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                                        {/* Sign Out */}
                                        <button 
                                            onClick={() => logout()}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3">
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>

                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {showConsentLogs && <ConsentLogsModal isOpen={showConsentLogs} onClose={() => setShowConsentLogs(false)} />}
                {showMedicalHistory && <MedicalHistoryModal isOpen={showMedicalHistory} onClose={() => setShowMedicalHistory(false)} />}
            </AnimatePresence>
        </>
    );
};

export default ProfileHeader;
