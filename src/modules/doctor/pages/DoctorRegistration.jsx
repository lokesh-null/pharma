import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FileBadge, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';

import { toast } from '@/lib/toast';

const DoctorRegistration = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        licenseNumber: '',
        hospitalName: '',
        location: ''
    });

    const handleRegister = () => {
        if (!formData.licenseNumber || !formData.hospitalName) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            navigate('/doctor/scan');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Logo size="lg" className="mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800">Complete Your Profile</h1>
                    <p className="text-slate-500">One-time setup for authorized doctors</p>
                </div>

                <Card className="border-0 shadow-xl bg-white">
                    <CardHeader>
                        <CardTitle>Professional Details</CardTitle>
                        <CardDescription>Enter your medical practice information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Medical License Number</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    placeholder="e.g. WBMC-2024-XXXX"
                                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <FileBadge className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Hospital / Clinic Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.hospitalName}
                                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                                    placeholder="e.g. Apollo Gleneagles"
                                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Branch / Location</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Salt Lake, Sector V"
                                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleRegister}
                            disabled={isLoading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-600/20"
                        >
                            {isLoading ? 'Verifying...' : 'Complete Registration'}
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default DoctorRegistration;
