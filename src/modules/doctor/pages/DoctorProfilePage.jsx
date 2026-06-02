import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Bell, ShieldCheck, PenTool, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';

const DoctorProfilePage = () => {
    const navigate = useNavigate();
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [signatureStep, setSignatureStep] = useState('verify'); // verify | upload | success

    const handleSignOut = () => {
        navigate('/login');
    };

    const handleVerifyOtp = () => {
        if (otp === '123456') {
            setSignatureStep('upload');
        } else {
            toast.error('Invalid OTP');
        }
    };

    const handleUpload = () => {
        setSignatureStep('success');
        setTimeout(() => {
            setShowOtpModal(false);
            setSignatureStep('verify');
            setOtp('');
            toast.success("Digital Signature Updated Successfully!");
        }, 1500);
    };

    return (
        <div className="px-4 py-6 pb-24 space-y-6">
            <h1 className="text-xl font-bold text-slate-900">My Profile</h1>

            {/* Profile Card */}
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-teal-700 to-teal-900 text-white relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm p-1">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor" alt="Doc" className="w-full h-full rounded-full bg-slate-100" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Dr. Sharma</h2>
                        <p className="text-teal-100 text-sm">General Physician</p>
                        <p className="text-teal-200 text-xs mt-1">Apollo Gleneagles</p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
            </Card>

            {/* Details */}
            <Card className="p-0 border-0 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">License Number</p>
                        <p className="text-slate-800 font-medium font-mono">WBMC-2023-8821</p>
                    </div>
                    <ShieldCheck className="text-teal-600" size={20} />
                </div>
                <div className="p-4 border-b border-slate-50 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Phone Number</p>
                        <p className="text-slate-800 font-medium">+91 98765 43210</p>
                    </div>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Email</p>
                        <p className="text-slate-800 font-medium">dr.sharma@apollo.com</p>
                    </div>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Location</p>
                        <p className="text-slate-800 font-medium">Salt Lake, Sector V, Kolkata</p>
                    </div>
                </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    onClick={() => setShowOtpModal(true)}
                    variant="outline"
                    className="w-full h-12 justify-start px-4 text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                    <PenTool className="mr-3 text-slate-500" size={18} /> Update Digital Signature
                </Button>
                <Button
                    variant="outline"
                    className="w-full h-12 justify-start px-4 text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                    <Bell className="mr-3 text-slate-500" size={18} /> Notifications
                </Button>
                <Button
                    onClick={handleSignOut}
                    className="w-full h-12 justify-start px-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 mt-4"
                >
                    <LogOut className="mr-3" size={18} /> Sign Out
                </Button>
            </div>

            {/* OTP / Upload Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl"
                        >
                            {signatureStep === 'verify' && (
                                <>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Security Check</h3>
                                    <p className="text-sm text-slate-500 mb-6">Enter the OTP sent to your mobile to update your digital signature.</p>

                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit OTP"
                                        className="w-full p-3 rounded-xl border border-slate-200 text-center text-lg tracking-widest font-bold mb-6 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                                    />

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1" onClick={() => setShowOtpModal(false)}>Cancel</Button>
                                        <Button className="flex-1 bg-teal-700 hover:bg-teal-800" onClick={handleVerifyOtp}>Verify</Button>
                                    </div>
                                </>
                            )}

                            {signatureStep === 'upload' && (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Lock size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Access Granted</h3>
                                        <p className="text-sm text-slate-500">Upload your new signature file.</p>
                                    </div>

                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                                        <p className="text-sm text-slate-400">Click to browse or drop file here</p>
                                        <p className="text-xs text-slate-300 mt-1">PNG, JPG (Max 2MB)</p>
                                    </div>

                                    <Button className="w-full mt-6 bg-slate-900 text-white" onClick={handleUpload}>
                                        Save New Signature
                                    </Button>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorProfilePage;
