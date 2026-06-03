import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, AlertOctagon, ScanLine, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

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

const SmartBilling = ({ prescription, scannedMedicine, onComplete, isDispensing }) => {
    if (!prescription) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col justify-center items-center text-slate-400">
                <ShoppingCart className="mb-4 text-slate-300" size={48} />
                <p>Scan a prescription to start billing.</p>
            </div>
        )
    }

    // For simplicity, we just list the prescription medicines. 
    // In a real app we'd calculate price from inventory.
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <ShoppingCart className="text-teal-600" size={20} />
                Billing Summary
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto">
                {prescription.medicines.map((med, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-slate-900">{med.name}</p>
                            <p className="text-xs text-slate-500">{med.dosage} (Qty: {med.quantity})</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                            {scannedMedicine?.name === med.name ? (
                                <Badge variant="success" className="bg-green-100 text-green-700 border-0">Scanned</Badge>
                            ) : 'Pending'}
                        </span>
                    </div>
                ))}

                <div className="h-px bg-slate-200 my-4" />
            </div>

            <Button
                size="lg"
                className={`w-full mt-6 text-lg font-bold h-14 ${!scannedMedicine ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-teal-700 hover:bg-teal-800 shadow-xl shadow-teal-900/20'}`}
                disabled={!scannedMedicine || isDispensing}
                onClick={onComplete}
            >
                {isDispensing ? 'Processing...' : 'Complete Sale & Dispense'}
            </Button>
        </div>
    );
};

const DualScanDashboard = ({ onVerifyPrescription, onVerifyMedicine, isVerifyingRx, isVerifyingMed }) => {
    const [rxToken, setRxToken] = useState('');
    const [medToken, setMedToken] = useState('');

    return (
        <div className="grid grid-cols-2 gap-4 h-64 mb-6">
            {/* Patient Scan */}
            <Card className="border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shadow-sm">
                    <ScanLine className="text-teal-600" size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-700">Scan Prescription QR</p>
                <input 
                    type="text" 
                    placeholder="Enter QR Token" 
                    className="w-full text-xs p-2 border rounded" 
                    value={rxToken}
                    onChange={(e) => setRxToken(e.target.value)}
                />
                <Button size="sm" className="w-full" disabled={!rxToken || isVerifyingRx} onClick={() => onVerifyPrescription(rxToken)}>
                    {isVerifyingRx ? 'Verifying...' : 'Verify Rx'}
                </Button>
            </Card>
            {/* Medicine Scan */}
            <Card className="border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shadow-sm">
                    <ScanLine className="text-blue-600" size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-700">Scan Medicine QR</p>
                <input 
                    type="text" 
                    placeholder="Enter QR Token" 
                    className="w-full text-xs p-2 border rounded" 
                    value={medToken}
                    onChange={(e) => setMedToken(e.target.value)}
                />
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" disabled={!medToken || isVerifyingMed} onClick={() => onVerifyMedicine(medToken)}>
                    {isVerifyingMed ? 'Verifying...' : 'Verify Med'}
                </Button>
            </Card>
        </div>
    )
}

const PharmacistModule = () => {
    const [matchStatus, setMatchStatus] = useState('idle'); // idle | scanning | match | mismatch
    const [saleCompleted, setSaleCompleted] = useState(false);
    const [prescription, setPrescription] = useState(null);
    const [scannedMedicine, setScannedMedicine] = useState(null);
    const [isVerifyingRx, setIsVerifyingRx] = useState(false);
    const [isVerifyingMed, setIsVerifyingMed] = useState(false);
    const [isDispensing, setIsDispensing] = useState(false);
    const [txHash, setTxHash] = useState('');
    const { user } = useAuthStore();

    const handleVerifyPrescription = async (token) => {
        setIsVerifyingRx(true);
        try {
            const res = await api.prescriptions.verifyQr(token);
            if (res.valid) {
                setPrescription(res.prescription);
                toast.success('Prescription verified');
                if (scannedMedicine) {
                    checkMatch(res.prescription, scannedMedicine);
                }
            }
        } catch (error) {
            toast.error('Invalid or expired Prescription QR');
        } finally {
            setIsVerifyingRx(false);
        }
    };

    const handleVerifyMedicine = async (token) => {
        setIsVerifyingMed(true);
        try {
            const res = await api.medicines.verifyQr(token);
            if (res.valid) {
                if (res.medicine.blockchainStatus === 'DISPENSED') {
                    toast.error('This medicine has already been dispensed!');
                    return;
                }
                setScannedMedicine(res.medicine);
                toast.success('Medicine verified');
                if (prescription) {
                    checkMatch(prescription, res.medicine);
                }
            }
        } catch (error) {
            toast.error('Invalid Medicine QR');
        } finally {
            setIsVerifyingMed(false);
        }
    };

    const checkMatch = (rx, med) => {
        const matches = rx.medicines.some(m => m.name.toLowerCase() === med.name.toLowerCase());
        setMatchStatus(matches ? 'match' : 'mismatch');
    };

    const handleComplete = async () => {
        if (!scannedMedicine?.id) return;
        setIsDispensing(true);
        try {
            const res = await api.medicines.dispense(scannedMedicine.id);
            setTxHash(res.txHash);
            setSaleCompleted(true);
        } catch (error) {
            toast.error('Failed to dispense medicine');
        } finally {
            setIsDispensing(false);
        }
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
                    <p className="text-slate-500 mb-8">Transaction Hash: {txHash}</p>
                    <Button onClick={() => { 
                        setSaleCompleted(false); 
                        setMatchStatus('idle'); 
                        setPrescription(null);
                        setScannedMedicine(null);
                        setTxHash('');
                    }}>New Sale</Button>
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

                    <DualScanDashboard 
                        onVerifyPrescription={handleVerifyPrescription}
                        onVerifyMedicine={handleVerifyMedicine}
                        isVerifyingRx={isVerifyingRx}
                        isVerifyingMed={isVerifyingMed}
                    />

                    {matchStatus === 'match' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-teal-50 rounded-2xl p-6 border border-teal-100">
                            <h4 className="font-semibold text-teal-900 mb-4">Match Confirmed</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-700">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{scannedMedicine.name}</p>
                                    <p className="text-xs text-slate-500">Authorized for dispensing</p>
                                </div>
                                <Badge variant="success" className="ml-auto bg-green-500 text-white">Valid</Badge>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Panel: Billing */}
                <div className="h-[500px]">
                    <SmartBilling 
                        prescription={prescription} 
                        scannedMedicine={scannedMedicine}
                        onComplete={handleComplete} 
                        isDispensing={isDispensing}
                    />
                </div>
            </div>
        </div>
    );
};

export default PharmacistModule;
