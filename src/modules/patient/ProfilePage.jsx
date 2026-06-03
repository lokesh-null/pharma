import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, ShieldCheck, Mail, Phone, MapPin, Bell, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/authStore';

const PatientProfile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    return (
        <div className="min-h-screen px-4 py-8 max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden ring-4 ring-white shadow-lg mb-3">
                        <img src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-2 right-0 bg-teal-600 p-1.5 rounded-full border-2 border-white text-white">
                        <ShieldCheck size={14} />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{user?.fullName || 'Patient'}</h2>
                <p className="text-sm text-slate-500">PharmaLync ID: {user?.id?.split('-')[0].toUpperCase() || 'PH-NEW'}</p>
            </div>

            {/* Personal Info */}
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wide text-slate-400 font-semibold">Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                        <Phone size={16} className="text-teal-600" />
                        <span className="font-medium text-slate-700">{user?.phone || 'Not provided'}</span>
                        {user?.phone && <Badge variant="success" className="ml-auto text-xs px-1.5">Verified</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Mail size={16} className="text-teal-600" />
                        <span className="font-medium text-slate-700">{user?.email || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <MapPin size={16} className="text-teal-600" />
                        <span className="font-medium text-slate-700">Not specified</span>
                    </div>
                </CardContent>
            </Card>

            {/* Settings */}
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
                <CardContent className="p-2">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-50 text-teal-700 p-2 rounded-lg"><Bell size={18} /></div>
                            <span className="font-medium text-slate-700">Notifications</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => logout()} className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-50 text-red-600 p-2 rounded-lg group-hover:bg-red-100"><LogOut size={18} /></div>
                            <span className="font-medium text-red-600">Sign Out</span>
                        </div>
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};

export default PatientProfile;
