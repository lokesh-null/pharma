import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle2, AlertCircle, X, Download, Printer, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';

const PrescriptionsPage = () => {
    const [activeTab, setActiveTab] = useState('issued'); // issued, partial, completed, expired
    const [selectedRx, setSelectedRx] = useState(null);
    const [allPrescriptions, setAllPrescriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();

    const tabs = [
        { id: 'issued', label: 'Issued' },
        { id: 'partial', label: 'Partially Fulfilled' },
        { id: 'completed', label: 'Completed' },
        { id: 'expired', label: 'Expired' }
    ];

    // Fetch Prescriptions
    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const data = await api.prescriptions.list();
                setAllPrescriptions(data.prescriptions || []);
            } catch (error) {
                console.error("Failed to fetch prescriptions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrescriptions();
    }, []);

    const filteredPrescriptions = allPrescriptions.filter(rx => rx.status === activeTab);

    const handleCardClick = (rx) => {
        if (rx.status !== 'expired') {
            setSelectedRx(rx);
        }
    };

    const handleDownload = () => {
        window.print();
    };

    return (
        <div className="min-h-screen px-4 py-6 max-w-md mx-auto pb-24 relative">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Prescriptions</h1>

            {/* Sub-Navigation */}
            <div className="flex space-x-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-teal-600">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-medium text-slate-500">Loading Prescriptions...</p>
                    </div>
                ) : filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map(rx => (
                        <Card
                            key={rx.id}
                            onClick={() => handleCardClick(rx)}
                            className={`border-0 shadow-md bg-white dark:bg-slate-900 overflow-hidden rounded-2xl dark:border dark:border-slate-800 transition-all ${rx.status !== 'expired'
                                    ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                                    : 'opacity-70 cursor-not-allowed grayscale-[0.5]'
                                }`}
                        >
                            <div className={`h-1.5 w-full ${rx.status === 'issued' ? 'bg-blue-500' :
                                rx.status === 'partial' ? 'bg-orange-500' :
                                    rx.status === 'completed' ? 'bg-green-500' :
                                        'bg-slate-300 dark:bg-slate-700'
                                }`} />

                            <div className="p-5">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{rx.doctor}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{rx.specialty}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{rx.hospital}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-[10px] font-normal text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 mb-1">
                                            {rx.date}
                                        </Badge>
                                        <p className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">#{rx.id.split('-')[2]}</p>
                                    </div>
                                </div>

                                {/* Medicines List */}
                                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-4 transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Prescribed Medicines</p>
                                    <div className="space-y-3">
                                        {rx.medicines.slice(0, 2).map((med, idx) => (
                                            <div key={idx} className="flex justify-between items-start pb-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                                        {med.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{med.timing}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{med.dosage}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {rx.medicines.length > 2 && (
                                            <p className="text-[10px] text-teal-600 font-medium text-center pt-1">
                                                + {rx.medicines.length - 2} more medicines
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer & Signature */}
                                <div className="flex justify-between items-end mt-2">
                                    <div className="text-xs">
                                        <p className="text-slate-400 dark:text-slate-500 mb-0.5">Valid Until</p>
                                        <p className={`font-semibold ${rx.status === 'expired' ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {rx.expiry}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        {/* Mock Signature */}
                                        <div className="h-8 w-24 mb-1 relative">
                                            <div className="absolute bottom-1 right-0 font-[cursive] text-lg text-slate-400 dark:text-slate-500 rotate-[-5deg] opacity-70">
                                                {rx.doctor.split(' ').slice(1).join(' ')}
                                            </div>
                                        </div>
                                        <div className="h-px w-24 bg-slate-200 dark:bg-slate-700 mb-0.5"></div>
                                        <p className="text-[9px] text-teal-600 dark:text-teal-500 font-medium uppercase tracking-wider flex items-center justify-end gap-1">
                                            <CheckCircle2 size={8} /> Digitally Signed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
                        {activeTab === 'issued' && <FileText className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={32} />}
                        {activeTab === 'partial' && <Clock className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={32} />}
                        {activeTab === 'completed' && <CheckCircle2 className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={32} />}
                        {activeTab === 'expired' && <AlertCircle className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={32} />}

                        <p>No prescriptions in "{tabs.find(t => t.id === activeTab)?.label}"</p>
                    </div>
                )}
            </div>

            {/* FULLSCREEN PRESCRIPTION MODAL */}
            <AnimatePresence>
                {selectedRx && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print:p-0">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRx(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden"
                        />

                        {/* Modal Content */}
                        <motion.div
                            layoutId={`rx-${selectedRx.id}`}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[85vh] sm:h-auto rounded-3xl shadow-2xl relative z-60 overflow-hidden flex flex-col print:h-auto print:shadow-none print:w-full print:rounded-none"
                        >
                            {/* Modal Header Actions */}
                            <div className="absolute top-4 right-4 flex gap-2 z-20 print:hidden">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="rounded-full bg-white/80 backdrop-blur"
                                    onClick={handleDownload}
                                >
                                    <Printer size={18} className="text-slate-700" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="rounded-full bg-white/80 backdrop-blur hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                    onClick={() => setSelectedRx(null)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 print:overflow-visible">
                                <div className="text-center mb-8 border-b border-slate-100 pb-6">
                                    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedRx.hospital}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Diagnostic & Polyclinic Center</p>
                                    <div className="flex justify-center gap-4 mt-4 text-xs font-mono text-slate-400">
                                        <span>Date: {selectedRx.date}</span>
                                        <span>ID: {selectedRx.id}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <p className="text-xs uppercase text-slate-400 font-bold mb-1">Doctor</p>
                                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">{selectedRx.doctor}</p>
                                        <p className="text-sm text-teal-600">{selectedRx.specialty}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase text-slate-400 font-bold mb-1">Patient</p>
                                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">{user?.fullName || 'Patient'}</p>
                                        <p className="text-sm text-slate-500">Gender: {user?.gender || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 print:bg-transparent print:p-0 print:border hover:border-slate-200 transition-colors">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                        Medication Plan
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedRx.medicines.map((med, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{med.name}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium text-teal-600">{med.timing}</span> • {med.duration}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-sm print:border-0 print:shadow-none">
                                                        {med.dosage}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end pt-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Status</p>
                                        <Badge className={`
                                            ${selectedRx.status === 'issued' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                selectedRx.status === 'partial' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                                    selectedRx.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                                        `}>
                                            {selectedRx.status.charAt(0).toUpperCase() + selectedRx.status.slice(1)}
                                        </Badge>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-12 w-32 mb-2 relative mx-auto">
                                            <div className="absolute bottom-1 right-0 font-[cursive] text-xl text-slate-600 dark:text-slate-400 rotate-[-5deg]">
                                                {selectedRx.doctor.split(' ').slice(1).join(' ')}
                                            </div>
                                        </div>
                                        <div className="h-px w-32 bg-slate-300 dark:bg-slate-600 mb-1"></div>
                                        <p className="text-[10px] text-teal-600 dark:text-teal-500 font-bold uppercase tracking-wider">
                                            Digitally Signed
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Actions - Mobile Only/Quick Access */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 print:hidden sm:hidden">
                                <Button className="w-full bg-slate-900 text-white" onClick={handleDownload}>
                                    <Download size={16} className="mr-2" /> Download PDF
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PrescriptionsPage;
