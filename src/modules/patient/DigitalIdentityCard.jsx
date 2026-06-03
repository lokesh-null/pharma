import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, CreditCard, ShieldCheck } from 'lucide-react';
import QRCode from "react-qr-code";
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/authStore';

const DigitalIdentityCard = () => {
    const [isFlipped, setIsFlipped] = useState(false);
    const { user } = useAuthStore();

    const patientData = {
        type: 'patient',
        id: user?.id,
        name: user?.fullName || 'Patient',
        dob: user?.dateOfBirth || 'Not specified',
        gender: user?.gender || 'Not specified'
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="w-full perspectiv-1000 h-56 relative group cursor-pointer" onClick={handleFlip}>
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-700"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front Face */}
                <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-xl card-gradient text-white p-6 flex flex-col justify-between border border-transparent dark:border-white/10">
                    {/* Background Deco */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-900/10 rounded-full -ml-5 -mb-5" />

                    {/* Header */}
                    <div className="flex justify-between items-start z-10">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <span className="font-semibold tracking-wide text-sm opacity-90">PharmaLync ID</span>
                        </div>
                        <CreditCard size={20} className="opacity-70" />
                    </div>

                    {/* Content */}
                    <div className="z-10">
                        <h3 className="text-2xl font-bold tracking-tight mb-1">{patientData.name}</h3>
                        <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase opacity-70">DOB</span>
                                <span>{patientData.dob}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase opacity-70">Gender</span>
                                <span>{patientData.gender}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="z-10 w-full">
                        <Button
                            variant="glass"
                            size="sm"
                            className="w-full justify-center gap-2 text-xs h-8 border-white/20 bg-white/10 hover:bg-white/20 text-white"
                        >
                            <QrCode size={14} />
                            Tap to Reveal QR
                        </Button>
                    </div>
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center justify-center rotate-y-180"
                    style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                >
                    <h3 className="text-teal-900 dark:text-teal-400 font-bold mb-4">Patient QR Code</h3>
                    <div className="bg-white p-2 rounded-xl border-2 border-teal-100 dark:border-teal-900 shadow-inner">
                        {/* Real QR */}
                        <div style={{ height: "auto", margin: "0 auto", maxWidth: 120, width: "100%" }}>
                            <QRCode
                                size={256}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={JSON.stringify(patientData)}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center">Scan this code at any PharmaLync partner clinic or pharmacy.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default DigitalIdentityCard;
