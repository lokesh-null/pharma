import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <Card className="overflow-hidden">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
                </div>
                <div className={`p-4 rounded-full ${colorClass}`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className="text-teal-600 font-medium">{trend}</span>
                    <span className="text-slate-500 ml-2">vs last month</span>
                </div>
            )}
        </CardContent>
    </Card>
);

const DashboardPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Users" 
                    value="0" 
                    icon={Users} 
                    colorClass="bg-blue-500" 
                />
                <StatCard 
                    title="Daily Prescriptions" 
                    value="0" 
                    icon={FileText} 
                    colorClass="bg-teal-500" 
                />
                <StatCard 
                    title="System Actions" 
                    value="0" 
                    icon={Activity} 
                    colorClass="bg-purple-500" 
                />
                <StatCard 
                    title="Security Alerts" 
                    value="0" 
                    icon={AlertTriangle} 
                    colorClass="bg-red-500" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Audit Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No recent audit logs found.
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1] }} 
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center"
                                >
                                    <ShieldCheck size={48} className="text-teal-600" />
                                </motion.div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">All Systems Operational</h3>
                                <p className="text-sm text-slate-500">Blockchain network and Database are fully synced.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
