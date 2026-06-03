import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Filter, Pill, ChevronRight, History, X, User, Building2, Store, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MotionCard from '@/components/ui/MotionCard';
import PageTransition from '@/components/ui/PageTransition';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

const MedicineLog = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRx, setSelectedRx] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const filters = ['Date', 'Time', 'Doctor', 'Prescription'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.prescriptions.getMyPrescriptions();
                setPrescriptions(res.prescriptions || []);
            } catch (err) {
                toast.error('Failed to load prescriptions');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    const filteredPrescriptions = prescriptions.filter(rx =>
        (rx.name || 'Prescription').toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.medicines.some(med => med.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredOtc = [];

    const hasResults = filteredPrescriptions.length > 0 || filteredOtc.length > 0;

    return (
        <PageTransition className="min-h-screen px-4 py-8 max-w-md mx-auto pb-28">
            {/* Header with Depth */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Medicine Log</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Track your health journey</p>
                    </motion.div>
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
                    className="bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/30 p-3 rounded-2xl text-white"
                >
                    <History size={24} />
                </motion.div>
            </div>

            {/* Search & Filter - Floating Glass */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3 mb-8 sticky top-24 z-30"
            >
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-teal-600" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search medicines..."
                        className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-glass focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all font-medium"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <button className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-2xl text-slate-500 dark:text-slate-400 border border-white/20 dark:border-slate-700 shadow-glass hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95">
                    <Filter size={20} />
                </button>
            </motion.div>

            {/* Content Area */}
            <div className="space-y-8">

                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">Loading your medicines...</div>
                ) : !hasResults && searchQuery ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400">No medicines found matching "{searchQuery}"</p>
                        <Button
                            variant="link"
                            onClick={() => setSearchQuery('')}
                            className="text-teal-600 dark:text-teal-400 font-bold"
                        >
                            Clear Search
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Prescriptions Section */}
                        {filteredPrescriptions.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prescriptions</h3>
                                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-0 h-5 text-[10px] px-2">
                                        {filteredPrescriptions.length} Active
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    {filteredPrescriptions.map((rx, idx) => (
                                        <MotionCard
                                            key={rx.id}
                                            delay={idx * 0.1}
                                            onClick={() => setSelectedRx(rx)}
                                            className="border-0 bg-white dark:bg-slate-900 shadow-soft dark:shadow-none dark:border dark:border-slate-800 rounded-3xl overflow-hidden cursor-pointer group"
                                        >
                                            <div className="p-1">
                                                {/* Card Header */}
                                                <div className="p-4 flex justify-between items-start bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl mb-1">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                                            {rx.name || 'Prescription'}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                            <span className="flex items-center gap-1"><CalendarClock size={12} /> {rx.date}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span>{rx.doctor}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-slate-400 group-hover:text-teal-600 transition-colors">
                                                        <ChevronRight size={18} />
                                                    </div>
                                                </div>

                                                {/* Meds List Preview */}
                                                <div className="px-2 pb-2 pt-1 space-y-1">
                                                    {rx.medicines.map(med => (
                                                        <div key={med.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                                                                <Pill size={18} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-center mb-0.5">
                                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{med.name}</span>
                                                                    <Badge variant="outline" className="bg-transparent border-slate-200 dark:border-slate-700 text-xs py-0 h-5 text-slate-500">
                                                                        x{med.quantity || med.count}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-medium">{med.dosage} {med.type ? `• ${med.type}` : ''}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </MotionCard>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* OTC Section */}
                        {filteredOtc.length > 0 && (
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Over The Counter</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {filteredOtc.map((med, idx) => (
                                        <MotionCard
                                            key={med.id}
                                            delay={0.3 + (idx * 0.1)}
                                            className="border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm rounded-2xl backdrop-blur-sm"
                                        >
                                            <div className="p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-orange-100 dark:border-orange-900/30">
                                                    <Store size={22} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{med.name}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{med.dosage} • Bought on {med.date}</p>
                                                </div>
                                            </div>
                                        </MotionCard>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>

            {/* Enhanced Modal */}
            <AnimatePresence>
                {selectedRx && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 perspective-1000">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setSelectedRx(null)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0.5 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-950 w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white relative shrink-0">
                                <button
                                    onClick={() => setSelectedRx(null)}
                                    className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 p-2.5 rounded-full backdrop-blur-sm transition-all active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Badge className="bg-teal-400/20 text-teal-50 border-0 mb-3 backdrop-blur-md">
                                        Verified Prescription
                                    </Badge>
                                    <h2 className="text-2xl font-bold mb-1 leading-tight">{selectedRx.name || 'Prescription'}</h2>
                                    <p className="text-teal-100/80 font-medium text-sm">Valid until {selectedRx.expiry}</p>
                                </motion.div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 space-y-8 overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="flex gap-4 group">
                                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-1">Prescribed By</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedRx.doctor}</p>
                                            <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <Building2 size={14} className="text-slate-400" /> {selectedRx.hospital}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 w-full" />

                                    <div className="flex gap-4 group">
                                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                            <Store size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-1">Dispensed At</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedRx.pharmacy}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] h-5 px-1.5">
                                                    Partner Verified
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={() => setSelectedRx(null)} className="w-full h-14 text-lg bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-[1.02] shadow-xl shadow-slate-900/10 rounded-2xl transition-all">
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
};

export default MedicineLog;
