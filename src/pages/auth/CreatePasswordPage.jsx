import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { toast } from '@/lib/toast';
import Logo from '@/components/ui/Logo';
import { api } from '@/lib/api';

const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score < 3) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score < 5) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-teal-500' };
};

const CreatePasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);

    const email = location.state?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [resendCount, setResendCount] = useState(0);

    const otpRefs = useRef([]);

    useEffect(() => {
        if (!email) {
            toast.warning('Invalid access. Please login first.');
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
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
    }, [resendTimer]);

    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            toast.warning('Please enter the complete 6-digit OTP.');
            return;
        }
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            toast.error('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Setting up your password...');

        try {
            const data = await api.auth.createPassword(email, otpString, password, confirmPassword);

            setAuth(data.user, data.accessToken, data.refreshToken);
            setLoadingMessage('Password created successfully!');
            toast.success('Your account is now fully secured, ' + (data.user.fullName || 'User') + '!');

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
            toast.error(error.message || 'Failed to create password.');
        } finally {
            setIsLoading(false);
            if (!loadingMessage.includes('successfully')) setLoadingMessage('');
        }
    };

    const handleResendOtp = async () => {
        if (!canResend || resendCount >= 5) return;

        setIsLoading(true);
        setLoadingMessage('Resending OTP...');

        try {
            await api.auth.sendOtp(email);
            toast.success('New OTP sent to your email.');
            setResendTimer(30);
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

    const pwdStrength = getPasswordStrength(password);

    if (!email) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size="lg" className="mb-4" />
                <p className="text-slate-500 font-medium">Account Security Update</p>
            </div>

            <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl">Create a Password</CardTitle>
                    <CardDescription className="text-center">
                        We are upgrading our security. Please verify the OTP sent to {email} and create a strong password.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {isLoading && loadingMessage && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-teal-50 border border-teal-100">
                            {loadingMessage.includes('successfully') ? (
                                <CheckCircle2 size={16} className="text-teal-600 animate-bounce" />
                            ) : (
                                <Loader2 size={16} className="text-teal-600 animate-spin" />
                            )}
                            <span className="text-sm font-medium text-teal-700">{loadingMessage}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Verification Code</label>
                            <div className="flex gap-2 justify-center">
                                {otp.map((digit, index) => (
                                    <input key={index} ref={(el) => (otpRefs.current[index] = el)} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} onPaste={index === 0 ? handleOtpPaste : undefined} className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900" disabled={isLoading} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900" placeholder="••••••••" disabled={isLoading} />
                            </div>
                            {password && (
                                <div className="mt-1 flex items-center justify-between px-1">
                                    <div className="flex gap-1 h-1.5 flex-1 max-w-[120px]">
                                        <div className={`flex-1 rounded-full ${pwdStrength.score >= 1 ? pwdStrength.color : 'bg-slate-200'}`} />
                                        <div className={`flex-1 rounded-full ${pwdStrength.score >= 3 ? pwdStrength.color : 'bg-slate-200'}`} />
                                        <div className={`flex-1 rounded-full ${pwdStrength.score >= 5 ? pwdStrength.color : 'bg-slate-200'}`} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase ${pwdStrength.color.replace('bg-', 'text-')}`}>{pwdStrength.label}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Confirm Password</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900" placeholder="••••••••" disabled={isLoading} />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading || otp.some(d => d === '') || !password || !confirmPassword} className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform bg-teal-700 hover:bg-teal-800">
                            {isLoading ? <><Loader2 size={18} className="mr-2 animate-spin" /> Processing...</> : 'Save & Continue'}
                        </Button>
                    </form>

                    <div className="text-center space-y-1">
                        {canResend && resendCount < 5 ? (
                            <button onClick={handleResendOtp} disabled={isLoading} className="inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700 hover:underline transition-colors disabled:opacity-50">
                                <RefreshCw size={14} /> Resend OTP
                            </button>
                        ) : resendCount >= 5 ? (
                            <p className="text-xs text-red-500 font-medium">Maximum resend attempts reached.</p>
                        ) : (
                            <p className="text-xs text-slate-400 font-medium tabular-nums">Resend available in {resendTimer}s</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="text-center mt-6">
                <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-700 hover:underline">Cancel and return to Login</Link>
            </div>
        </motion.div>
    );
};

export default CreatePasswordPage;
