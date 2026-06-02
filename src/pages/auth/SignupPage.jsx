import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Stethoscope, Store, ShieldCheck, ArrowRight, UserPlus, CreditCard } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { toast } from '@/lib/toast';

const roles = [
    { id: 'patient', label: 'Patient', icon: User, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'pharmacist', label: 'Pharmacist', icon: Store, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const SignupPage = () => {
    const [selectedRole, setSelectedRole] = useState('patient');
    const [step, setStep] = useState('details'); // 'details' | 'otp'
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        govId: '', // For Patient/Doctor
        licenseId: '' // For Pharmacist
    });
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = () => {
        // Validation
        if (!formData.name || !formData.mobile) {
            toast.error('Please fill in all required fields.');
            return;
        }
        if ((selectedRole === 'patient' || selectedRole === 'doctor') && !formData.govId) {
            toast.error('Government ID is required.');
            return;
        }
        if (selectedRole === 'pharmacist' && !formData.licenseId) {
            toast.error('License ID is required.');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setStep('otp');
        }, 1000);
    };

    const verifyOtp = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (otp === '123456') {
                // Mock success routing
                if (selectedRole === 'patient') navigate('/patient/dashboard');
                else if (selectedRole === 'doctor') navigate('/doctor/dashboard');
                else if (selectedRole === 'pharmacist') navigate('/pharmacist/scan');
            } else {
                toast.error('Invalid OTP. Use 123456');
            }
        }, 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size="lg" className="mb-4" />
                <p className="text-slate-500 font-medium">Create your PharmaLync Account</p>
            </div>

            <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl">
                        {step === 'otp' ? 'Verify Mobile' : 'Join PharmaLync'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 'otp'
                            ? `Enter the OTP sent to ${formData.mobile}`
                            : 'Select your role to start registration'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Role Selector */}
                    {step === 'details' && (
                        <div className="grid grid-cols-3 gap-3">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200",
                                        selectedRole === role.id
                                            ? `border-teal-600 ${role.bg} shadow-sm transform scale-105`
                                            : "border-transparent bg-slate-50 hover:bg-slate-100 text-slate-400"
                                    )}
                                >
                                    <role.icon
                                        size={24}
                                        className={selectedRole === role.id ? role.color : "currentColor"}
                                    />
                                    <span className={cn(
                                        "text-xs font-semibold",
                                        selectedRole === role.id ? "text-slate-900" : "currentColor"
                                    )}>
                                        {role.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Inputs */}
                    <div className="space-y-4">
                        {step === 'details' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900"
                                        placeholder="e.g. Rahul Kumar"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900"
                                        placeholder="e.g. 9876543210"
                                    />
                                </div>

                                {selectedRole !== 'pharmacist' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Government ID (Aadhaar/Driver's License)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="govId"
                                                value={formData.govId}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900"
                                                placeholder="e.g. 1234-5678-9012"
                                            />
                                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">License ID</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="licenseId"
                                                value={formData.licenseId}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900"
                                                placeholder="e.g. LIC-WB-9982"
                                            />
                                            <Store className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">
                                    One Time Password
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900 text-center tracking-widest text-lg"
                                    placeholder="• • • • • •"
                                />
                                <div className="text-center">
                                    <button className="text-xs text-teal-600 font-medium hover:underline">
                                        Resend OTP
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter>
                    {step === 'details' ? (
                        <Button
                            onClick={handleRegister}
                            disabled={isLoading}
                            className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform"
                        >
                            {isLoading ? 'Processing...' : 'Get OTP'} <ArrowRight className="ml-2" size={18} />
                        </Button>
                    ) : (
                        <Button
                            onClick={verifyOtp}
                            disabled={isLoading}
                            className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform bg-teal-700 hover:bg-teal-800"
                        >
                            {isLoading ? 'Verifying...' : 'Verify & Register'} <UserPlus className="ml-2" size={18} />
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {step === 'details' && (
                <p className="text-center mt-6 text-sm text-slate-400">
                    Already have an account? <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
                </p>
            )}

            {step === 'otp' && (
                <p className="text-center mt-6 text-sm text-slate-400">
                    <button onClick={() => setStep('details')} className="text-slate-500 hover:text-slate-700">
                        &larr; Back to Role Selection
                    </button>
                </p>
            )}

        </motion.div>
    );
};

export default SignupPage;
