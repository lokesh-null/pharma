import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { toast } from '@/lib/toast';
import Logo from '@/components/ui/Logo';
import { api } from '@/lib/api';

const RESEND_COOLDOWN = 30; // seconds

const LoginPage = () => {
    const [step, setStep] = useState('email'); // 'email' | 'otp'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [userName, setUserName] = useState('');
    const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
    const [canResend, setCanResend] = useState(false);
    const [resendCount, setResendCount] = useState(0);

    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);
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

    // ─── Email Validation ────────────────────────────────────────────
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // ─── Step 1: Check Email ─────────────────────────────────────────
    const handleCheckEmail = async (e) => {
        e?.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            toast.warning('Please enter your email address.');
            return;
        }
        if (!isValidEmail(trimmedEmail)) {
            toast.warning('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Checking account...');

        try {
            const data = await api.auth.checkEmail(trimmedEmail);

            if (data.exists) {
                // Existing user — send OTP
                setUserName(data.user?.fullName || '');
                setLoadingMessage('Sending OTP...');

                await api.auth.sendOtp(trimmedEmail);

                toast.success('OTP sent to your email.');
                setStep('otp');
                setResendTimer(RESEND_COOLDOWN);
                setCanResend(false);

                // Focus first OTP input after transition
                setTimeout(() => otpRefs.current[0]?.focus(), 300);
            } else {
                // New user — redirect to signup
                toast.info('No account found. Let\'s create one.');
                navigate('/signup', { state: { email: trimmedEmail } });
            }
        } catch (error) {
            toast.error(error.message || 'Unable to check email. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // ─── OTP Input Handlers ──────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
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
            // Auto-submit
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
            const data = await api.auth.verifyOtp(email.trim().toLowerCase(), otpString);

            setAuth(data.user, data.accessToken, data.refreshToken);
            setLoadingMessage('Login successful!');

            toast.success('Welcome back, ' + (data.user.fullName || 'User') + '!');

            // Role-based redirect
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
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [email, navigate, setAuth]);

    // ─── Resend OTP ──────────────────────────────────────────────────
    const handleResendOtp = async () => {
        if (!canResend || resendCount >= 5) return;

        setIsLoading(true);
        setLoadingMessage('Resending OTP...');

        try {
            await api.auth.resendOtp(email.trim().toLowerCase());
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

    // ─── Back to Email ───────────────────────────────────────────────
    const handleBackToEmail = () => {
        setStep('email');
        setOtp(['', '', '', '', '', '']);
        setResendTimer(RESEND_COOLDOWN);
        setCanResend(false);
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
                <p className="text-slate-500 font-medium">Secure Healthcare Access Portal</p>
            </div>

            <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl">
                        {step === 'otp' ? 'Verify Your Identity' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 'otp'
                            ? `Enter the OTP sent to ${email}`
                            : 'Enter your email to sign in'}
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
                            {loadingMessage.includes('successful') ? (
                                <CheckCircle2 size={16} className="text-teal-600 animate-bounce" />
                            ) : (
                                <Loader2 size={16} className="text-teal-600 animate-spin" />
                            )}
                            <span className="text-sm font-medium text-teal-700">{loadingMessage}</span>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait" custom={step === 'otp' ? 1 : -1}>
                        {/* ─── Email Step ──────────────────── */}
                        {step === 'email' && (
                            <motion.div
                                key="email-step"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                                <form onSubmit={handleCheckEmail} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1" htmlFor="login-email">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                id="login-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900"
                                                placeholder="john@example.com"
                                                autoComplete="email"
                                                autoFocus
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || !email.trim()}
                                        className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform"
                                    >
                                        {isLoading ? (
                                            <><Loader2 size={18} className="mr-2 animate-spin" /> Processing...</>
                                        ) : (
                                            <>Continue <ArrowRight className="ml-2" size={18} /></>
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
                                {/* User welcome message */}
                                {userName && (
                                    <div className="text-center">
                                        <p className="text-sm text-slate-500">
                                            Welcome back, <span className="font-semibold text-slate-700">{userName}</span>
                                        </p>
                                    </div>
                                )}

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
                                                id={`otp-input-${index}`}
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
                                        <>Verify & Sign In <ShieldCheck className="ml-2" size={18} /></>
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
                {step === 'email' ? (
                    <p className="text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-teal-600 font-semibold hover:underline">
                            Sign up
                        </Link>
                    </p>
                ) : (
                    <button
                        onClick={handleBackToEmail}
                        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to email
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default LoginPage;
