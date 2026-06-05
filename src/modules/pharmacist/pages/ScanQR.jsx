import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QrCode, User, X, Camera, RefreshCw } from 'lucide-react';
import { usePharmacyStore } from '../store';
import { api } from '@/lib/api';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

const ScanQR = () => {
    const navigate = useNavigate();
    const setPatient = usePharmacyStore(state => state.setPatient);
    const [isLoading, setIsLoading] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
            html5QrCodeRef.current = null;
        }
    };

    const startScanner = async () => {
        setScannerActive(true);
        setErrorMsg('');

        // Wait for DOM to render the scanner container
        setTimeout(async () => {
            try {
                if (html5QrCodeRef.current) {
                    try {
                        if (html5QrCodeRef.current.isScanning) {
                            await html5QrCodeRef.current.stop();
                        }
                        html5QrCodeRef.current.clear();
                    } catch (e) {
                        console.error(e);
                    }
                }
                html5QrCodeRef.current = new Html5Qrcode("staff-reader");

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCodeRef.current.start(
                    { facingMode: "environment" },
                    config,
                    async (decodedText) => {
                        await stopScanner();
                        handleVerification(decodedText);
                    }
                );
            } catch (err) {
                console.error("Scanner Error", err);
                setErrorMsg("Could not access camera. Please check permissions.");
                setScannerActive(false);
            }
        }, 100);
    };

    const handleVerification = async (token) => {
        if (!token) return;
        setIsLoading(true);

        // Check if scanned code is direct Patient Data (JSON)
        try {
            const data = JSON.parse(token);
            if (data.type === 'patient' && data.id) {
                try {
                    // Fetch patient details
                    const userRes = await api.users.search(data.id);
                    
                    // Fetch patient prescriptions
                    const presRes = await api.prescriptions.list(data.id);
                    
                    const patientData = {
                        id: userRes.patient.id,
                        name: userRes.patient.fullName,
                        age: 25, // Fallback age or parse from dob if available
                        prescriptions: presRes.prescriptions || []
                    };

                    setPatient(patientData);
                    navigate('/pharmacist/dispense');
                    return;
                } catch (apiError) {
                    setErrorMsg("Failed to load patient data: " + (apiError.message || 'Unknown error'));
                    setScannerActive(false);
                    setIsLoading(false);
                    return;
                }
            }
        } catch (e) {
            // Not a JSON object, proceed to API verification
        }

        try {
            const result = await api.prescriptions.verifyQr(token);

            // Normalize the prescription format to match the frontend expectations
            const normalizedPrescription = {
                id: result.prescription.id,
                status: 'issued', // or derived from dispensed status
                doctor: result.prescription.doctor?.name || 'Unknown Doctor',
                date: new Date(result.prescription.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                medicines: result.prescription.medicines
            };

            // Map backend patient to store
            const patientData = {
                id: result.prescription.patientId,
                name: result.prescription.patient?.name || 'Unknown Patient',
                age: 25,
                prescriptions: [normalizedPrescription]
            };

            setPatient(patientData);
            navigate('/pharmacist/dispense');
        } catch (error) {
            setErrorMsg("Verification Failed: " + error.message);
            setScannerActive(false);
        } finally {
            setIsLoading(false);
        }
    };

    const closeScanner = async () => {
        await stopScanner();
        setScannerActive(false);
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
            <AnimatePresence>
                {!scannerActive ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <div className={`bg-slate-100 p-8 rounded-full mb-8 ${isLoading ? 'animate-spin' : 'animate-pulse'}`}>
                            <QrCode size={64} className="text-teal-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            {isLoading ? 'Verifying...' : 'Ready to Scan'}
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-xs">
                            Scan a patient's digital health card or prescription QR code to proceed.
                        </p>

                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                {errorMsg}
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full max-w-xs h-14 text-lg bg-teal-600 hover:bg-teal-700 rounded-2xl shadow-lg"
                            onClick={startScanner}
                            disabled={isLoading}
                        >
                            <Camera className="mr-2" /> Start Staff Scanner
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6"
                    >
                        <button
                            onClick={closeScanner}
                            className="absolute top-8 right-8 text-white/50 hover:text-white p-2 bg-white/10 rounded-full"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
                            <div className="text-center">
                                <h3 className="text-white text-xl font-bold">Staff Verification System</h3>
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Medical Personnel Use Only</p>
                            </div>

                            <div className="w-full aspect-square bg-black rounded-3xl border-2 border-white/10 relative overflow-hidden ring-4 ring-teal-500/20">
                                <div id="staff-reader" className="w-full h-full"></div>

                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-teal-500/30 rounded-2xl relative">
                                        <motion.div
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                            className="absolute left-0 right-0 h-0.5 bg-teal-400 shadow-[0_0_15px_#2DD4BF]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <p className="text-white/60 text-sm">Align the QR code within the frame</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScanQR;
