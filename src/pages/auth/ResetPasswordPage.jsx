import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const otpRefs = useRef([]);

    useEffect(() => {
        if (!email) {
            toast.warning('Invalid access. Please request a password reset first.');
            navigate('/forgot-password');
        }
    }, [email, navigate]);

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

        try {
            await api.auth.resetPassword(email, otpString, password, confirmPassword);
            setIsSuccess(true);
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };

    const pwdStrength = getPasswordStrength(password);

    if (!email) return null;

    if (isSuccess) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
                <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80 p-8">
                    <CheckCircle2 className="w-16 h-16 text-teal-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Reset!</h2>
                    <p className="text-slate-500 mb-6">Your password has been changed successfully.</p>
                    <Button onClick={() => navigate('/login')} className="w-full bg-teal-600 hover:bg-teal-700">Back to Login</Button>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size="lg" className="mb-4" />
                <p className="text-slate-500 font-medium">Account Recovery</p>
            </div>

            <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl">Reset Your Password</CardTitle>
                    <CardDescription className="text-center">Enter the OTP sent to {email} and set your new password.</CardDescription>
                </CardHeader>

                <CardContent>
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
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Confirm New Password</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900" placeholder="••••••••" disabled={isLoading} />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading || otp.some(d => d === '') || !password || !confirmPassword} className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform bg-teal-700 hover:bg-teal-800">
                            {isLoading ? <><Loader2 size={18} className="mr-2 animate-spin" /> Resetting...</> : 'Reset Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="text-center mt-6">
                <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-700 hover:underline">Cancel</Link>
            </div>
        </motion.div>
    );
};

export default ResetPasswordPage;
