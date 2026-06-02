import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Stethoscope, Store, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/authStore';
import { toast } from '@/lib/toast';
import Logo from '@/components/ui/Logo';

const roles = [
    { id: 'patient', label: 'Patient', icon: User, color: 'text-teal-600', bg: 'bg-teal-50', backendRole: 'PATIENT' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50', backendRole: 'ADMIN' },
    { id: 'pharmacist', label: 'Pharmacist', icon: Store, color: 'text-orange-600', bg: 'bg-orange-50', backendRole: 'PHARMACY' },
];

const LoginPage = () => {
    const [selectedRole, setSelectedRole] = useState('patient');
    const [step, setStep] = useState('role'); // 'role' | 'otp' (only for patient)
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState(''); // Used for Doctor/Pharmacist
    const [otp, setOtp] = useState(''); // Used for Patient
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);

    const handlePatientLogin = () => {
        if (!identifier) {
            toast.warning("Please enter Mobile Number or Aadhaar");
            return;
        }
        // Simulate OTP sent for Patient
        toast.info("OTP sent to registered mobile number");
        setStep('otp');
    };

    const handleStaffLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) {
            toast.warning("Please enter both email and password");
            return;
        }

        setIsLoading(true);
        try {
            await login(identifier, password);
            toast.success("Login successful!");
            
            // Route based on role
            if (selectedRole === 'doctor') {
                navigate('/doctor/dashboard');
            } else if (selectedRole === 'pharmacist') {
                navigate('/pharmacist/scan');
            }
        } catch (error) {
            toast.error(error.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyPatientOtp = () => {
        if (otp === '123456') { // Mock OTP for Patient
            toast.success("Identity verified successfully");
            navigate('/patient/dashboard');
        } else {
            toast.error('Invalid OTP. Use 123456 for demo');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size="lg" className="mb-4" />
                <p className="text-slate-500 font-medium">Secure Healthcare Access Portal</p>
            </div>

            <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl">
                        {step === 'otp' ? 'Verify Identity' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 'otp'
                            ? `Enter the OTP sent to registered mobile`
                            : 'Select your role to continue'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Role Selector */}
                    {step === 'role' && (
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
                        {step === 'role' && selectedRole === 'patient' && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">
                                    Mobile / Aadhaar
                                </label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900"
                                    placeholder="Enter Mobile or Aadhaar"
                                />
                            </div>
                        )}

                        {step === 'role' && selectedRole !== 'patient' && (
                            <form id="staff-login" onSubmit={handleStaffLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900"
                                        placeholder={selectedRole === 'doctor' ? 'dr.sharma@pharmalync.in' : 'pharmacy@pharmalync.in'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </form>
                        )}

                        {step === 'otp' && (
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
                    {step === 'role' ? (
                        <Button
                            onClick={selectedRole === 'patient' ? handlePatientLogin : handleStaffLogin}
                            disabled={isLoading}
                            form={selectedRole !== 'patient' ? 'staff-login' : undefined}
                            type={selectedRole !== 'patient' ? 'submit' : 'button'}
                            className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform"
                        >
                            {isLoading ? 'Processing...' : (selectedRole === 'patient' ? 'Get OTP' : 'Sign In')} <ArrowRight className="ml-2" size={18} />
                        </Button>
                    ) : (
                        <Button
                            onClick={verifyPatientOtp}
                            disabled={isLoading}
                            className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform bg-teal-700 hover:bg-teal-800"
                        >
                            {isLoading ? 'Verifying...' : 'Verify & Login'} <ShieldCheck className="ml-2" size={18} />
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {step === 'role' && (
                <p className="text-center mt-6 text-sm text-slate-400">
                    Don't have an account? <Link to="/signup" className="text-teal-600 font-semibold hover:underline">Sign up</Link>
                </p>
            )}

            {step === 'otp' && (
                <p className="text-center mt-6 text-sm text-slate-400">
                    <button onClick={() => setStep('role')} className="text-slate-500 hover:text-slate-700">
                        &larr; Back to Role Selection
                    </button>
                </p>
            )}

        </motion.div>
    );
};

export default LoginPage;
