
import React from 'react';
import { UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/authStore';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    return (
        <div className="p-6">
            <div className="flex flex-col items-center py-8">
                <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4 overflow-hidden">
                    {user?.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle size={64} />
                    )}
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{user?.fullName || 'Pharmacist'}</h2>
                <p className="text-slate-500">ID: {user?.id?.split('-')[0].toUpperCase() || 'PH-NEW'}</p>
                <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    Active Session
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500">Branch</span>
                    <span className="font-medium">Indiranagar, BLR</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500">Shift</span>
                    <span className="font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between py-2">
                    <span className="text-slate-500">Role</span>
                    <span className="font-medium">Senior Pharmacist</span>
                </div>
            </div>

            <Button variant="destructive" className="w-full mt-8" onClick={() => logout()}>
                <LogOut className="mr-2" size={18} /> Logout
            </Button>
        </div>
    );
}

export default Profile;
