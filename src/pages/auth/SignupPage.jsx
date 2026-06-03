import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Stethoscope, Store, ShieldCheck, ArrowRight, ArrowLeft, UserPlus, Loader2, CheckCircle2, RefreshCw, Mail, Phone, Calendar, Users } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';

const RESEND_COOLDOWN = 30;

const roles = [
    { id: 'PATIENT', label: 'Patient', icon: User, color: 'text-teal-600', bg: 'bg-teal-50', borderColor: 'border-teal-500' },
    { id: 'DOCTOR', label: 'Doctor', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-500' },
    { id: 'PHARMACIST', label: 'Pharmacist', icon: Store, color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-500' },
];

const SignupPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);

    const [step, setStep] = useState('details'); // 'details' | 'otp'
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        role: 'PATIENT',
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
    const [canResend, setCanResend] = useState(false);
    const [resendCount, setResendCount] = useState(0);

    const otpRefs = useRef([]);

    // ─── Resend Timer ────────────────────────────────────────────────
    useEffect(() => {
        let interval;
        if (step === 'otp' && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer]);

    // ─── Form Handlers ───────────────────────────────────────────────
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // ─── Step 1: Register ────────────────────────────────────────────
    const handleRegister = async (e) => {
        e?.preventDefault();

        const { email, fullName, role } = formData;

        if (!email.trim() || !fullName.trim()) {
            toast.error('Please fill in all required fields.');
            return;
        }
        if (!isValidEmail(email.trim())) {
            toast.error('Please enter a valid email address.');
            return;
        }
        if (fullName.trim().length < 2) {
            toast.error('Full name must be at least 2 characters.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Creating your account...');

        try {
            await api.auth.register({
                ...formData,
                email: email.trim().toLowerCase(),
                fullName: fullName.trim(),
                phone: formData.phone.trim() || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                gender: formData.gender || undefined,
            });

            toast.success('Account created! OTP sent to your email.');
            setStep('otp');
            setResendTimer(RESEND_COOLDOWN);
            setCanResend(false);

            // Focus first OTP input
            setTimeout(() => otpRefs.current[0]?.focus(), 300);
        } catch (error) {
            if (error.status === 409) {
                toast.warning('An account with this email already exists. Try logging in.');
                navigate('/login');
            } else {
                toast.error(error.message || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // ─── OTP Input Handlers ──────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        if (value && index === 5 && newOtp.every(d => d !== '')) {
            handleVerifyOtp(newOtp.join(''));
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            otpRefs.current[5]?.focus();
            handleVerifyOtp(pastedData);
        }
    };

    // ─── Step 2: Verify OTP ──────────────────────────────────────────
    const handleVerifyOtp = useCallback(async (otpString) => {
        if (!otpString || otpString.length !== 6) {
            toast.warning('Please enter the complete 6-digit OTP.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Verifying OTP...');

        try {
            const data = await api.auth.verifyOtp(formData.email.trim().toLowerCase(), otpString);

            setAuth(data.user, data.accessToken, data.refreshToken);
            setLoadingMessage('Account verified!');
            toast.success('Welcome to PharmaLync, ' + (data.user.fullName || 'User') + '!');

            setTimeout(() => {
                const roleRoutes = {
                    'PATIENT': '/patient/dashboard',
                    'DOCTOR': '/doctor/dashboard',
                    'PHARMACIST': '/pharmacist/scan',
                    'ADMIN': '/admin/dashboard',
                };
                navigate(roleRoutes[data.user.role] || '/patient/dashboard');
            }, 500);
        } catch (error) {
            toast.error(error.message || 'Invalid OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [formData.email, navigate, setAuth]);

    // ─── Resend OTP ──────────────────────────────────────────────────
    const handleResendOtp = async () => {
        if (!canResend || resendCount >= 5) return;

        setIsLoading(true);
        setLoadingMessage('Resending OTP...');

        try {
            await api.auth.resendOtp(formData.email.trim().toLowerCase());
            toast.success('New OTP sent to your email.');
            setResendTimer(RESEND_COOLDOWN);
            setCanResend(false);
            setResendCount(prev => prev + 1);
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch (error) {
            toast.error(error.message || 'Failed to resend OTP.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // ─── Animation Variants ──────────────────────────────────────────
    const slideVariants = {
        enter: (direction) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            {/* Header */}
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size="lg" className="mb-4" />
                <p className="text-slate-500 font-medium">Create your PharmaLync Account</p>
            </div>

            <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl">
                        {step === 'otp' ? 'Verify Your Email' : 'Join PharmaLync'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 'otp'
                            ? `Enter the OTP sent to ${formData.email}`
                            : 'Fill in your details to get started'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Loading Overlay */}
                    {isLoading && loadingMessage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-teal-50 border border-teal-100"
                        >
                            {loadingMessage.includes('verified') || loadingMessage.includes('created') ? (
                                <CheckCircle2 size={16} className="text-teal-600 animate-bounce" />
                            ) : (
                                <Loader2 size={16} className="text-teal-600 animate-spin" />
                            )}
                            <span className="text-sm font-medium text-teal-700">{loadingMessage}</span>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait" custom={step === 'otp' ? 1 : -1}>
                        {/* ─── Details Step ──────────────── */}
                        {step === 'details' && (
                            <motion.div
                                key="details-step"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                                <form onSubmit={handleRegister} className="space-y-4">
                                    {/* Role Selector */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Select Your Role</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {roles.map((role) => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: role.id })}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200",
                                                        formData.role === role.id
                                                            ? `${role.borderColor} ${role.bg} shadow-sm transform scale-105`
                                                            : "border-transparent bg-slate-50 hover:bg-slate-100 text-slate-400"
                                                    )}
                                                >
                                                    <role.icon
                                                        size={24}
                                                        className={formData.role === role.id ? role.color : "currentColor"}
                                                    />
                                                    <span className={cn(
                                                        "text-xs font-semibold",
                                                        formData.role === role.id ? "text-slate-900" : "currentColor"
                                                    )}>
                                                        {role.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1" htmlFor="signup-email">
                                            Email Address <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                id="signup-email"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900"
                                                placeholder="john@example.com"
                                                readOnly={!!location.state?.email}
                                                autoComplete="email"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1" htmlFor="signup-name">
                                            Full Name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                id="signup-name"
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900"
                                                placeholder="e.g. John Doe"
                                                autoComplete="name"
                                                autoFocus={!!location.state?.email}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Phone (Optional) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1" htmlFor="signup-phone">
                                            Phone Number <span className="text-slate-300 text-[10px] normal-case">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                id="signup-phone"
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900"
                                                placeholder="e.g. +1 555-0100"
                                                autoComplete="tel"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Optional fields row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Date of Birth */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1" htmlFor="signup-dob">
                                                Date of Birth <span className="text-slate-300 text-[10px] normal-case">(opt)</span>
                                            </label>
                                            <input
                                                id="signup-dob"
                                                type="date"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900 text-sm"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        {/* Gender */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1" htmlFor="signup-gender">
                                                Gender <span className="text-slate-300 text-[10px] normal-case">(opt)</span>
                                            </label>
                                            <select
                                                id="signup-gender"
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900 text-sm appearance-none"
                                                disabled={isLoading}
                                            >
                                                <option value="">Select...</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || !formData.email.trim() || !formData.fullName.trim()}
                                        className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform"
                                    >
                                        {isLoading ? (
                                            <><Loader2 size={18} className="mr-2 animate-spin" /> Creating Account...</>
                                        ) : (
                                            <>Create Account & Get OTP <ArrowRight className="ml-2" size={18} /></>
                                        )}
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* ─── OTP Step ───────────────────── */}
                        {step === 'otp' && (
                            <motion.div
                                key="otp-step"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="space-y-5"
                            >
                                {/* OTP Input Boxes */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">
                                        Verification Code
                                    </label>
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (otpRefs.current[index] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                onPaste={index === 0 ? handleOtpPaste : undefined}
                                                className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900"
                                                disabled={isLoading}
                                                id={`signup-otp-input-${index}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Verify Button */}
                                <Button
                                    onClick={() => handleVerifyOtp(otp.join(''))}
                                    disabled={isLoading || otp.some(d => d === '')}
                                    className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform bg-teal-700 hover:bg-teal-800"
                                >
                                    {isLoading ? (
                                        <><Loader2 size={18} className="mr-2 animate-spin" /> Verifying...</>
                                    ) : (
                                        <>Verify & Register <UserPlus className="ml-2" size={18} /></>
                                    )}
                                </Button>

                                {/* Resend OTP */}
                                <div className="text-center space-y-1">
                                    {canResend && resendCount < 5 ? (
                                        <button
                                            onClick={handleResendOtp}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700 hover:underline transition-colors disabled:opacity-50"
                                        >
                                            <RefreshCw size={14} /> Resend OTP
                                        </button>
                                    ) : resendCount >= 5 ? (
                                        <p className="text-xs text-red-500 font-medium">
                                            Maximum resend attempts reached.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-medium tabular-nums">
                                            Resend available in {resendTimer}s
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Footer Links */}
            <div className="text-center mt-6">
                {step === 'details' ? (
                    <p className="text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-teal-600 font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                ) : (
                    <button
                        onClick={() => {
                            setStep('details');
                            setOtp(['', '', '', '', '', '']);
                        }}
                        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to details
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default SignupPage;
