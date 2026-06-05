import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { toast } from '@/lib/toast';
import Logo from '@/components/ui/Logo';
import { api } from '@/lib/api';

const LoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);

    const handleLogin = async (e) => {
        e.preventDefault();

        const trimmedIdentifier = identifier.trim().toLowerCase();
        if (!trimmedIdentifier || !password) {
            toast.warning('Please enter both email/phone and password.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Authenticating...');

        try {
            const data = await api.auth.login(trimmedIdentifier, password);

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
            if (error.data?.code === 'PASSWORD_CREATION_REQUIRED') {
                const userEmail = error.data.email;
                toast.info('Please create a password for your account to continue.');
                try {
                    await api.auth.sendOtp(userEmail);
                    navigate('/create-password', { state: { email: userEmail } });
                } catch (sendErr) {
                    toast.error('Failed to send verification code. Please try again.');
                }
            } else {
                toast.error(error.message || 'Invalid credentials. Please try again.');
                setPassword('');
            }
        } finally {
            setIsLoading(false);
            if (!loadingMessage.includes('successful')) {
                setLoadingMessage('');
            }
        }
    };

    const slideVariants = {
        enter: { x: 80, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -80, opacity: 0 },
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
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-center">
                        Sign in with your Email or Phone
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
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

                    <AnimatePresence mode="wait">
                        <motion.div
                            key="login-step"
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1" htmlFor="login-identifier">
                                        Email or Phone
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            id="login-identifier"
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900"
                                            placeholder="john@example.com or 9876543210"
                                            autoComplete="username"
                                            autoFocus
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase" htmlFor="login-password">
                                            Password
                                        </label>
                                        <Link to="/forgot-password" className="text-xs font-semibold text-teal-600 hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            id="login-password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-medium text-slate-900"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !identifier.trim() || !password}
                                    className="w-full h-12 text-base font-semibold shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-transform bg-teal-700 hover:bg-teal-800 mt-2"
                                >
                                    {isLoading ? (
                                        <><Loader2 size={18} className="mr-2 animate-spin" /> Authenticating...</>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>

            <div className="text-center mt-6">
                <p className="text-sm text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-teal-600 font-semibold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default LoginPage;
