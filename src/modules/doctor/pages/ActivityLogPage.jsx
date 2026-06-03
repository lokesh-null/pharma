import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Calendar, Clock, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';

const ActivityLogPage = () => {
    const { user } = useAuthStore();
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            if (!user?.id) return;
            try {
                setIsLoading(true);
                const res = await api.consultations.getDoctorHistory(user.id);
                const mapped = (res.history || []).map(item => ({
                    id: item.id,
                    type: 'diagnosis',
                    title: `Consulted Patient`,
                    description: `${item.patientName} - ${item.diagnosis}`,
                    time: item.time,
                    date: item.date,
                    icon: Stethoscope,
                    color: 'text-blue-600',
                    bg: 'bg-blue-100'
                }));
                setActivities(mapped);
            } catch (error) {
                console.error("Failed to load activity history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchActivities();
    }, [user?.id]);

    return (
        <div className="px-4 py-6 pb-24 space-y-6">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="text-teal-600" />
                Weekly Activity Log
            </h1>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                        No recent activity found.
                    </div>
                ) : (
                    activities.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-4 border-0 shadow-sm flex gap-4 items-start hover:bg-slate-50 transition-colors">
                                <div className={`p-3 rounded-full ${item.bg} ${item.color} shrink-0`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                                            <Clock size={10} /> {item.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                                        <Calendar size={12} />
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="text-center pt-4">
                <p className="text-xs text-slate-400">Showing last 7 days of activity</p>
            </div>
        </div>
    );
};

export default ActivityLogPage;
