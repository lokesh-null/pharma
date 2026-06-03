import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, Search, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const PatientScannerWidget = () => {
    const [status, setStatus] = useState('idle'); // idle | scanning | success
    const [scannedPatient, setScannedPatient] = useState(null);

    const handleScan = async () => {
        setStatus('scanning');
        try {
            const data = await api.patients.list();
            if (data.patients && data.patients.length > 0) {
                setScannedPatient(data.patients[0]);
            }
        } catch (error) {
            console.error('Scan failed', error);
        }
        
        setTimeout(() => {
            setStatus('success');
        }, 1500);
    };

    return (
        <Card className={`h-full border-0 shadow-lg transition-all duration-500 ${status === 'success' ? 'ring-2 ring-medical-green bg-green-50/50' : 'bg-white/80'}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-900">
                    <ScanLine className="text-teal-600" size={20} />
                    Patient Intake
                </CardTitle>
            </CardHeader>
            <CardContent>
                {status === 'idle' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Enter Aadhaar or Phone..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
                            />
                        </div>

                        <div className="relative flex items-center gap-4 py-2">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-xs text-slate-400 font-medium">OR</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <Button onClick={handleScan} className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2">
                            <ScanLine size={16} /> Scan QR Code
                        </Button>
                    </div>
                )}

                {status === 'scanning' && (
                    <div className="flex flex-col items-center justify-center py-6 gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                        <p className="text-sm text-slate-500 animate-pulse">Scanning identity...</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-medical-green mb-3">
                            <UserCheck size={32} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{scannedPatient?.name || 'New Patient'}</h3>
                        <div className="flex gap-2 mt-1 mb-4">
                            <Badge variant="secondary">Patient</Badge>
                            <Badge variant="success">Verified</Badge>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setStatus('idle')}>
                            New Scan
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
};

export default PatientScannerWidget;
