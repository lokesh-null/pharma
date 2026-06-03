import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Search, CheckCircle, Pill, CalendarClock } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';

import { toast } from '@/lib/toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';

const DraftPrescriptionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMeds, setSelectedMeds] = useState([]);
    const [availableMedicines, setAvailableMedicines] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuthStore();

    React.useEffect(() => {
        api.medicines.list().then(res => setAvailableMedicines(res.medicines || []));
    }, []);

    // Add Med Logic
    const addMed = (med) => {
        setSelectedMeds([...selectedMeds, {
            ...med,
            dosage: '1-0-1',
            qty: 10,
            validity: '5 Days'
        }]);
        setSearchQuery('');
    };

    // Remove Med Logic
    const removeMed = (index) => {
        const newMeds = [...selectedMeds];
        newMeds.splice(index, 1);
        setSelectedMeds(newMeds);
    };

    // Update Field Logic
    const updateMed = (index, field, value) => {
        const newMeds = [...selectedMeds];
        newMeds[index][field] = value;
        setSelectedMeds(newMeds);
    };

    const handleIssue = async () => {
        if (selectedMeds.length === 0) {
            toast.warning("Please add at least one medicine.");
            return;
        }

        setIsSaving(true);
        try {
            await api.prescriptions.create({
                patientId: id,
                medicines: selectedMeds.map(m => ({
                    medicineId: m.id,
                    quantity: parseInt(m.qty),
                    dosage: m.dosage
                }))
            });
            toast.success("Prescription Digitally Signed & Issued!");
            navigate('/doctor');
        } catch (error) {
            console.error("Failed to issue prescription:", error);
            toast.error("Failed to issue prescription");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageTransition className="px-4 py-6 pb-32 space-y-6">
            <div>
                <p className="text-sm font-bold text-slate-400 uppercase">Step 2 of 2</p>
                <h1 className="text-2xl font-bold text-slate-900">Draft Prescription</h1>
            </div>

            {/* Medicine Selector */}
            <div className="relative z-20">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search Medicines (e.g. Dolo)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>

                {/* Search Results Dropdown */}
                {searchQuery && (
                    <div className="absolute top-full left-0 w-full bg-white border border-slate-100 shadow-xl rounded-xl mt-2 overflow-hidden max-h-48 overflow-y-auto">
                        {availableMedicines
                            .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(med => (
                                <div
                                    key={med.id}
                                    onClick={() => addMed(med)}
                                    className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                                >
                                    <span className="font-medium text-slate-800">{med.name}</span>
                                    <span className="text-xs text-slate-400">{med.category || 'Medicine'}</span>
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* Added Medicines List */}
            <div className="space-y-4">
                {selectedMeds.map((med, idx) => (
                    <Card key={idx} className="p-4 border border-slate-200 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">{idx + 1}</span>
                                {med.name}
                            </h3>
                            <button onClick={() => removeMed(idx)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Dosage</label>
                                <input
                                    type="text"
                                    value={med.dosage}
                                    onChange={(e) => updateMed(idx, 'dosage', e.target.value)}
                                    className="w-full p-2 bg-slate-50 rounded-lg text-sm font-medium border-transparent focus:bg-white focus:border-blue-200 border transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Duration</label>
                                <input
                                    type="text"
                                    value={med.validity}
                                    onChange={(e) => updateMed(idx, 'validity', e.target.value)}
                                    className="w-full p-2 bg-slate-50 rounded-lg text-sm font-medium border-transparent focus:bg-white focus:border-blue-200 border transition-all"
                                />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Total Qty</label>
                                <input
                                    type="number"
                                    value={med.qty}
                                    onChange={(e) => updateMed(idx, 'qty', e.target.value)}
                                    className="w-full p-2 bg-slate-50 rounded-lg text-sm font-medium border-transparent focus:bg-white focus:border-blue-200 border transition-all"
                                />
                            </div>
                        </div>
                    </Card>
                ))}

                {selectedMeds.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Pill className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-400 font-medium text-sm">No medicines added yet.</p>
                    </div>
                )}
            </div>

            {/* Digital Signature Block */}
            <div className="mt-8 border-t border-slate-100 pt-6 flex justify-end">
                <div className="text-right">
                    <div className="w-40 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center mb-2 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <p className="font-handwriting text-xl text-blue-900 -rotate-6">{user?.fullName || 'Doctor'}</p>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs text-green-600 font-bold uppercase tracking-wider">
                        <CheckCircle size={12} /> Digitally Signed
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Reg: WBMC-2023-8821</p>
                </div>
            </div>

            <div className="fixed bottom-20 left-0 w-full px-6 py-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-lg-up">
                <Button
                    onClick={handleIssue}
                    disabled={isSaving}
                    className="w-full max-w-md mx-auto h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-lg shadow-teal-700/20"
                >
                    {isSaving ? "Issuing..." : "Issue Prescription"}
                </Button>
            </div>
        </PageTransition>
    );
};

export default DraftPrescriptionPage;
