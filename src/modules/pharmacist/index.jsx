import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, AlertOctagon, ScanLine, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/authStore';

const SafetyCheckBanner = ({ status }) => { // status: match | mismatch | idle
    if (status === 'idle') return null;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className={`w-full p-4 mb-6 rounded-2xl flex items-center justify-between shadow-lg ${status === 'match'
                ? 'bg-medical-green text-white shadow-green-900/20'
                : 'bg-medical-red text-white shadow-red-900/20'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    {status === 'match' ? <ShieldCheck size={28} /> : <AlertOctagon size={28} />}
                </div>
                <div>
                    <h3 className="font-bold text-lg tracking-tight">
                        {status === 'match' ? 'MATCH CONFIRMED' : 'MISMATCH DETECTED'}
                    </h3>
                    <p className="text-white/80 text-xs font-medium">
                        {status === 'match' ? 'Patient prescription matches identity.' : 'Patient ID does not match prescription.'}
                    </p>
                </div>
            </div>

            {status === 'match' && (
                <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/20 text-xs font-mono">
                    AUTH-8922
                </div>
            )}
        </motion.div>
    );
};

const SmartBilling = ({ isMatched, onComplete }) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <ShoppingCart className="text-teal-600" size={20} />
                Billing Summary
            </h3>

            <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div>
                        <p className="font-semibold text-slate-900">Paracetamol 500mg</p>
                        <p className="text-xs text-slate-500">1 Strip (10 tabs)</p>
                    </div>
                    <span className="font-bold text-slate-700">₹32.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div>
                        <p className="font-semibold text-slate-900">Cetirizine 10mg</p>
                        <p className="text-xs text-slate-500">1 Strip (10 tabs)</p>
                    </div>
                    <span className="font-bold text-slate-700">₹45.00</span>
                </div>

                <div className="h-px bg-slate-200 my-4" />

                <div className="flex justify-between items-center text-lg">
                    <span className="text-slate-500 font-medium">Total</span>
                    <span className="font-bold text-slate-900">₹77.00</span>
                </div>
            </div>

            <Button
                size="lg"
                className={`w-full mt-6 text-lg font-bold h-14 ${!isMatched ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-teal-700 hover:bg-teal-800 shadow-xl shadow-teal-900/20'}`}
                disabled={!isMatched}
                onClick={onComplete}
            >
                {isMatched ? 'Complete Sale' : 'Verify to Bill'}
            </Button>
        </div>
    );
};

const DualScanDashboard = ({ setMatchStatus }) => {
    return (
        <div className="grid grid-cols-2 gap-4 h-64 mb-6">
            {/* Patient Scan */}
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-3" onClick={() => setMatchStatus('scanning')}>
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <ScanLine className="text-slate-400 group-hover:text-teal-600" size={32} />
                </div>
                <p className="text-sm font-semibold text-slate-400 group-hover:text-teal-700">Scan Patient QR</p>
            </Card>
            {/* Medicine Scan */}
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <ScanLine className="text-slate-400 group-hover:text-blue-600" size={32} />
                </div>
                <p className="text-sm font-semibold text-slate-400 group-hover:text-blue-700">Scan Medicine</p>
            </Card>
        </div>
    )
}

const PharmacistModule = () => {
    const [matchStatus, setMatchStatus] = useState('idle'); // idle | scanning | match | mismatch
    const [saleCompleted, setSaleCompleted] = useState(false);
    const [scannedPatient, setScannedPatient] = useState({ name: 'Verified Patient', id: 'AUTH-1029' });
    const { user } = useAuthStore();

    const handleScanFlow = () => {
        setMatchStatus('scanning');
        setTimeout(() => {
            setMatchStatus('match');
        }, 1500);
    };

    const handleComplete = () => {
        setSaleCompleted(true);
    };

    if (saleCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-green-100 text-medical-green rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-teal-900 mb-2">Sale Completed</h2>
                    <p className="text-slate-500 mb-8">Transaction ID: #PH-8922-XJ</p>
                    <Button onClick={() => { setSaleCompleted(false); setMatchStatus('idle'); }}>New Sale</Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 pt-8 pb-24 max-w-7xl mx-auto bg-slate-50">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <Logo size="md" className="mb-1" />
                    <p className="text-slate-500 text-sm font-medium">{user?.fullName || 'Pharmacist'} POS Terminal</p>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                    POS Terminal
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Panel: Scans & Status */}
                <div>
                    <SafetyCheckBanner status={matchStatus} />

                    {matchStatus === 'idle' && <DualScanDashboard setMatchStatus={handleScanFlow} />}

                    {matchStatus === 'scanning' && (
                        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full mb-4"
                            />
                            <p className="text-slate-500 font-medium">Verifying cross-reference...</p>
                        </div>
                    )}

                    {matchStatus === 'match' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-teal-50 rounded-2xl p-6 border border-teal-100">
                            <h4 className="font-semibold text-teal-900 mb-4">Patient Verified</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${scannedPatient.id}`} alt="Patient" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{scannedPatient.name}</p>
                                    <p className="text-xs text-slate-500">Aadhaar Verified</p>
                                </div>
                                <Badge variant="success" className="ml-auto">Active Rx</Badge>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Panel: Billing */}
                <div className="h-[500px]">
                    <SmartBilling isMatched={matchStatus === 'match'} onComplete={handleComplete} />
                </div>
            </div>
        </div>
    );
};

export default PharmacistModule;
