import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ProfileHeader from './ProfileHeader';
import DigitalIdentityCard from './DigitalIdentityCard';
import RemindersList from './components/RemindersList';
import MedVerifierFAB from './MedVerifierFAB';
import { Sparkles, Sun, Moon, Calendar, Zap, Activity } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import MotionCard from '@/components/ui/MotionCard';

import { useAuthStore } from '@/lib/authStore';

const PatientDashboard = () => {
    const { scrollY } = useScroll();
    const [greeting, setGreeting] = useState('');
    const [timeIcon, setTimeIcon] = useState(null);
    const { user } = useAuthStore();
    const firstName = user?.fullName?.split(' ')[0] || 'Patient';

    // Dynamic Greeting Logic
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good Morning');
            setTimeIcon(<Sun className="text-amber-500" size={24} />);
        } else if (hour < 18) {
            setGreeting('Good Afternoon');
            setTimeIcon(<Sun className="text-orange-500" size={24} />);
        } else {
            setGreeting('Good Evening');
            setTimeIcon(<Moon className="text-indigo-400" size={24} />);
        }
    }, []);

    // Parallax & Fade Effects for Header
    const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8]);
    const headerY = useTransform(scrollY, [0, 100], [0, -20]);

    return (
        <PageTransition className="min-h-screen relative pb-32 overflow-hidden">
            {/* Ambient Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-20 -right-20 w-96 h-96 bg-teal-200/20 dark:bg-teal-900/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-40 -left-20 w-72 h-72 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-[80px]"
                />
            </div>

            <ProfileHeader />

            <main className="px-5 pt-8 space-y-8 max-w-md mx-auto relative z-10">

                {/* Greeting Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: headerOpacity, y: headerY }}
                    className="flex justify-between items-end mb-2"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {timeIcon}
                            <span className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight leading-tight">
                            {greeting},<br />
                            <span className="text-teal-600 dark:text-teal-400">{firstName}</span>
                        </h1>
                    </div>
                </motion.div>

                {/* Identity Card Section - The Hero Component */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                >
                    <DigitalIdentityCard />
                </motion.div>

                {/* Reminders Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Sparkles size={16} className="text-teal-500" />
                            Today's Plan
                        </h3>
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            3 Pending
                        </span>
                    </div>
                    <RemindersList />
                </div>
            </main>

            <MedVerifierFAB />
        </PageTransition>
    );
};

export default PatientDashboard;
