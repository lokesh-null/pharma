
import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { usePharmacyStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Minus,
    Plus,
    ScanLine,
    ShoppingCart,
    Trash2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DispensePage = () => {
    const navigate = useNavigate();
    const {
        inventory,
        currentPatient,
        dispenseItem,
        clearSession
    } = usePharmacyStore();

    // Session State
    const [billItems, setBillItems] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [manualCode, setManualCode] = useState('');

    // No patient selected means Walk-in Customer

    // Derived State
    const totalAmount = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // --- ACTIONS ---

    const html5QrCodeRef = React.useRef(null);
    const scannerRef = React.useRef(null);
    const lastScanTime = React.useRef(0);

    const startScanner = async () => {
        setIsScanning(true);
        setScanMessage('');

        setTimeout(async () => {
            try {
                if (html5QrCodeRef.current) {
                    try {
                        if (html5QrCodeRef.current.isScanning) {
                            await html5QrCodeRef.current.stop();
                        }
                        html5QrCodeRef.current.clear();
                    } catch (e) {
                        console.log(e);
                    }
                }
                html5QrCodeRef.current = new Html5Qrcode("med-reader");

                // Config for scanner - no qrbox to allow scanning full-width barcodes
                const config = { fps: 10 };

                // Start scanning
                await html5QrCodeRef.current.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // On Success
                        handleRealScan(decodedText);
                    },
                    (errorMessage) => {
                        // ignore errors
                    }
                );
            } catch (err) {
                console.error("Error starting scanner", err);
                setIsScanning(false);
                toast.error("Camera error: " + err);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (e) {
                console.log(e);
            }
            html5QrCodeRef.current = null;
        }
        setIsScanning(false);
    };

    const handleRealScan = (scannedText) => {
        const now = Date.now();
        if (now - lastScanTime.current < 2000) return; // 2 seconds cooldown
        lastScanTime.current = now;

        // MOCK LOGIC: "Mock everything"
        // If the scanned text matches a medicine ID, use it.
        // If not, pick a random medicine from inventory to simulate a successful scan of a box.

        let med = inventory.find(m => m.id === scannedText || m.name === scannedText);

        if (!med) {
            if (inventory.length > 0) {
                // Pick a random med to make the demo work smoothly with any QR code
                const randomIndex = Math.floor(Math.random() * inventory.length);
                med = inventory[randomIndex];
            } else {
                // If inventory is completely empty, create a mock item using the scanned text
                med = {
                    id: `MOCK-${Date.now()}`,
                    name: scannedText || 'Unknown Medicine',
                    price: Math.floor(Math.random() * 500) + 50,
                    stock: 100
                };
            }
        }

        if (med) {
            addToBill(med, 1);
            toast.success(`Scanned: ${med.name}`);
            stopScanner();
        }
    };

    const handleManualEntry = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleRealScan(manualCode.trim());
            setManualCode('');
        }
    };

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const addToBill = (med, qty, prescriptionId = null, medRx = null) => {
        setBillItems(prev => {
            // Check if already in bill (Same Item AND Same Prescription Context)
            const existingIndex = prev.findIndex(item => item.id === med.id && item.prescriptionId === prescriptionId);
            if (existingIndex > -1) {
                const newItems = [...prev];
                const existingItem = newItems[existingIndex];

                // VALIDATION: Stock
                if (existingItem.quantity + qty > med.stock) {
                    toast.warning(`Not enough stock! Max: ${med.stock}`);
                    return prev;
                }

                // VALIDATION: Prescription Limit
                if (prescriptionId && medRx) {
                    const totalRequested = existingItem.quantity + qty;
                    const remainingAllowed = medRx.maxQty - medRx.dispensed;
                    if (totalRequested > remainingAllowed) {
                        toast.warning(`Cannot exceed prescribed quantity. Limit: ${remainingAllowed} more.`);
                        return prev;
                    }
                }

                newItems[existingIndex].quantity += qty;
                return newItems;
            } else {
                // New Item
                // VALIDATION: Stock
                if (qty > med.stock) {
                    toast.warning(`Not enough stock! Max: ${med.stock}`);
                    return prev;
                }

                return [...prev, { ...med, quantity: qty, prescriptionId }];
            }
        });
    };

    const updateQuantity = (itemId, prescriptionId, newQty) => {
        if (newQty < 1) {
            removeFromBill(itemId, prescriptionId);
            return;
        }

        setBillItems(prev => prev.map(item => {
            // Match by ID AND PrescriptionID
            if (item.id === itemId && item.prescriptionId === prescriptionId) {
                // Find Constraints
                const med = item;

                // 1. Stock Constraint
                if (newQty > med.stock) {
                    toast.warning(`Max stock available is ${med.stock}`);
                    return item; // No change
                }

                // 2. Prescription Constraint
                if (item.prescriptionId && currentPatient) {
                    const rx = currentPatient.prescriptions.find(r => r.id === item.prescriptionId);
                    const medRx = rx?.medicines.find(m => m.medicineId === itemId);
                    if (medRx) {
                        const maxAllowed = medRx.maxQty - medRx.dispensed;
                        if (newQty > maxAllowed) {
                            // Use toast or alert
                            return item; // No change
                        }
                    }
                }

                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromBill = (itemId, prescriptionId) => {
        setBillItems(prev => prev.filter(i => !(i.id === itemId && i.prescriptionId === prescriptionId)));
    };

    const handleCheckout = async () => {
        setIsScanning(true); // Reuse as loading state
        try {
            if (billItems.length === 0) {
                setIsScanning(false);
                return;
            }

            const payload = billItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                prescriptionId: item.prescriptionId || null
            }));

            await api.prescriptions.dispense(payload);

            toast.success("Checkout Successful!");
            setShowConfirm(true);
            setIsScanning(false);
        } catch (error) {
            toast.error("Checkout Failed: " + (error.message || "Unknown error"));
            setIsScanning(false);
        }
    };

    const finishSession = () => {
        setShowConfirm(false);
        setBillItems([]);
        clearSession();
        navigate('/pharmacist/scan');
    };


    // --- RENDER HELPERS ---

    const PrescriptionModal = () => {
        if (!selectedPrescription) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col"
                >
                    <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
                        <div>
                            <h3 className="font-bold">Prescription #{selectedPrescription.id}</h3>
                            <p className="text-xs opacity-80">Dr. {selectedPrescription.doctor}</p>
                        </div>
                        <button onClick={() => setSelectedPrescription(null)}><X /></button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 space-y-4">
                        {selectedPrescription.medicines.map(medRx => {
                            const medInfo = inventory.find(m => m.id === medRx.medicineId);
                            const remaining = medRx.maxQty - medRx.dispensed;
                            const isFullyDispensed = remaining <= 0;
                            const inCart = billItems.find(i => i.id === medRx.medicineId && i.prescriptionId === selectedPrescription.id);
                            const currentQty = inCart ? inCart.quantity : 0;

                            if (isFullyDispensed) return null; // Don't show fully dispensed items? Or show as completed? Requirement says "Expired prescriptions must NOT appear". Assume filled meds in pending Rx should effectively be disabled or hidden. Let's hide them to keep it clean.

                            return (
                                <div key={medRx.medicineId} className="border border-slate-200 rounded-xl p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800">{medRx.name}</h4>
                                        <Badge variant={isFullyDispensed ? "secondary" : "outline"} className={isFullyDispensed ? "bg-slate-100" : "text-teal-700 bg-teal-50"}>
                                            {medInfo ? `₹${medInfo.price}` : 'N/A'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">{medRx.dosage} • {medRx.days} Days</p>

                                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Max: {remaining}
                                        </span>

                                        <div className="flex items-center gap-3">
                                            {currentQty > 0 ? (
                                                <>
                                                    <button onClick={() => updateQuantity(medRx.medicineId, currentQty - 1)} className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center text-slate-600"><Minus size={16} /></button>
                                                    <span className="font-bold w-4 text-center">{currentQty}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (currentQty < remaining) updateQuantity(medRx.medicineId, currentQty + 1);
                                                        }}
                                                        disabled={currentQty >= remaining}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${currentQty >= remaining ? 'bg-slate-300' : 'bg-teal-600'}`}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <Button size="sm" onClick={() => addToBill(medInfo, 1, selectedPrescription.id, medRx)} disabled={!medInfo || medInfo.stock === 0} className="bg-teal-600 h-8 text-xs">
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        );
    };

    if (showConfirm) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-green-50 p-6 flex-col text-center">
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} />
                </motion.div>
                <h2 className="text-2xl font-bold text-teal-900 mb-2">Dispense Complete</h2>
                <p className="text-slate-600 mb-8">Stock updated and transaction recorded.</p>
                <Button onClick={finishSession} size="lg" className="w-full bg-teal-700">Next Patient</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-24 bg-slate-50">
            {/* Top Patient Bar */}
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-slate-800">{currentPatient?.name || 'Walk-in Customer'}</h2>
                        <p className="text-xs text-slate-500">{currentPatient ? `ID: ${currentPatient.id}` : 'General Sale'}</p>
                    </div>
                    {currentPatient && (
                        <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold">
                            {currentPatient.age}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">

                {/* Left Panel: Medicine Scan & Cart */}
                <div className="space-y-4">
                    {/* Mock Scanner */}
                    {/* Real Scanner for Medicines */}
                    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg relative min-h-[14rem]">
                        {!isScanning ? (
                            <div
                                className="flex flex-col items-center justify-center p-6 h-56 cursor-pointer hover:bg-slate-800 transition-colors"
                                onClick={startScanner}
                            >
                                <ScanLine size={48} className="mb-4 text-teal-400" />
                                <p className="font-bold text-lg">Tap to Scan Medicine</p>
                                <p className="text-xs text-slate-400 mt-2 text-center">Scan medicine barcode/QR to add to bill</p>
                            </div>
                        ) : (
                            <div className="w-full h-full relative">
                                <div id="med-reader" className="w-full h-64 bg-black"></div>
                                <button
                                    onClick={stopScanner}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full z-10"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute inset-0 pointer-events-none border-2 border-teal-500/50 z-0"></div>
                            </div>
                        )}

                        {scanMessage && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-20 whitespace-nowrap"
                            >
                                {scanMessage}
                            </motion.div>
                        )}
                    </div>

                    {/* Manual Entry Fallback */}
                    <form onSubmit={handleManualEntry} className="flex gap-2">
                        <Input 
                            placeholder="Camera failing? Enter barcode manually..." 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="bg-white"
                        />
                        <Button type="submit" variant="secondary" className="bg-slate-200 hover:bg-slate-300 text-slate-800">Add</Button>
                    </form>

                    {/* Current Dispense List (Cart) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2 text-slate-700">
                                <ShoppingCart size={18} /> Dispensing
                            </h3>
                            <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded">
                                {billItems.length} Items
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                            {billItems.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No medicines scanned yet.
                                </div>
                            ) : (
                                billItems.map(item => (
                                    <div key={item.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {item.prescriptionId ? 'Rx Item' : 'OTC'} • ₹{item.price * item.quantity}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => updateQuantity(item.id, item.prescriptionId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Minus size={12} /></button>
                                            <span className="font-mono font-bold text-sm w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.prescriptionId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Plus size={12} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-500">Total</span>
                                <span className="text-xl font-bold text-slate-900">₹{totalAmount}</span>
                            </div>
                            <Button className="w-full bg-teal-700 hover:bg-teal-800 font-bold h-12" disabled={billItems.length === 0} onClick={handleCheckout}>
                                Confirm Dispense
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Prescriptions */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Prescriptions</h3>

                    {!currentPatient ? (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-orange-700 text-sm">
                            <AlertCircle size={16} className="inline mr-2" />
                            Use "Walk-in" mode for OTC. To see prescriptions, please scan Patient ID first.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {currentPatient.prescriptions
                                .filter(rx => rx.status !== 'completed')
                                .map(rx => (
                                    <div
                                        key={rx.id}
                                        onClick={() => setSelectedPrescription(rx)}
                                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-800 group-hover:text-teal-700">#{rx.id}</h4>
                                                <p className="text-xs text-slate-500">{rx.date} • Dr. {rx.doctor}</p>
                                            </div>
                                            <ChevronRight className="text-slate-300 group-hover:text-teal-500" />
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {rx.medicines.map((m, i) => {
                                                const remaining = m.maxQty - m.dispensed;
                                                if (remaining <= 0) return null;
                                                return (
                                                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                                        {m.name} ({remaining})
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            {currentPatient.prescriptions.every(rx => rx.status === 'completed') && (
                                <p className="text-center text-slate-400 py-8 text-sm">
                                    No pending prescriptions.
                                </p>
                            )}
                        </div>
                    )}
                </div>

            </div>

            <PrescriptionModal />
        </div>
    );
};

export default DispensePage;
