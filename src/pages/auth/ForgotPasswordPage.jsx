import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from '@/lib/toast';
import Logo from '@/components/ui/Logo';
import { api } from '@/lib/api';

const ForgotPasswordPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedIdentifier = identifier.trim().toLowerCase();

        if (!trimmedIdentifier) {
            toast.warning('Please enter your email or phone number.');
            return;
        }

        setIsLoading(true);

        try {
            await api.auth.sendOtp(trimmedIdentifier);
            toast.success('If an account exists, an OTP has been sent.');
            navigate('/reset-password', { state: { email: trimmedIdentifier } });
        } catch (error) {
            toast.error(error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size="lg" className="mb-4" />
                <p className="text-slate-500 font-medium">Account Recovery</p>
            </div>

            <Card className="border-0 shadow-2xl shadow-teal-900/10 backdrop-blur-xl bg-white/80">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl">Forgot Password?</CardTitle>
                    <CardDescription className="text-center">
                        Enter your registered email or phone to receive a verification code.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Email or Phone</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900" placeholder="john@example.com" disabled={isLoading} autoFocus />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading || !identifier.trim()} className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform bg-teal-700 hover:bg-teal-800">
                            {isLoading ? <><Loader2 size={18} className="mr-2 animate-spin" /> Sending...</> : <>Send Verification Code <ArrowRight className="ml-2" size={18} /></>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="text-center mt-6">
                <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft size={14} /> Back to Login
                </Link>
            </div>
        </motion.div>
    );
};

export default ForgotPasswordPage;
