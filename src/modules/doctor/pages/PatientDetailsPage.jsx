import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { User, Droplets, AlertCircle, FileText, ChevronRight, Stethoscope, Clock, ShieldCheck, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import api from '@/lib/api';

const PatientDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                // Fetch patient by ID or Email
                const data = await api.users.search(id);
                
                // Fetch patient medical history
                const historyData = await api.consultations.getHistory(data.patient.id);
                
                setPatient({
                    name: data.patient.fullName,
                    id: data.patient.id,
                    email: data.patient.email,
                    gender: data.patient.gender || "Not specified",
                    bloodGroup: "N/A",
                    img: data.patient.profilePicture,
                    summary: { allergies: [], chronicConditions: [], pastConditions: [] },
                    history: historyData.history || []
                });
            } catch (error) {
                console.error("Failed to fetch patient:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatient();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-teal-600 mb-4" size={32} />
                <p className="text-slate-500">Loading patient details...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Patient not found.</p>
                <Button onClick={() => navigate('/doctor')} variant="outline" className="mt-4">Back to Dashboard</Button>
            </div>
        );
    }
    return (
        <PageTransition className="px-4 py-6 pb-32 space-y-6">

            {/* Overview Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                    <img src={patient.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}`} alt={patient.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{patient.name}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <span>{patient.gender}</span>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100">
                            {patient.bloodGroup}
                        </Badge>
                        <Badge variant="outline" className="text-slate-500">
                            ID: {id}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Medical Summary Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Medical Summary</h3>

                <div className="grid grid-cols-1 gap-3">
                    {/* Allergies */}
                    <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-orange-800 font-semibold text-sm">
                            <AlertCircle size={16} /> Known Allergies
                        </div>
                        {patient.summary.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {patient.summary.allergies.map(a => (
                                    <Badge key={a} variant="outline" className="bg-white border-orange-200 text-slate-700">{a}</Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No known allergies reported.</p>
                        )}
                    </div>

                    {/* Conditions */}
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold text-sm">
                            <FileText size={16} /> Diagnosed Conditions
                        </div>
                        {patient.summary.chronicConditions.length > 0 || patient.summary.pastConditions.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    <span>Current: <span className="font-medium">{patient.summary.chronicConditions.join(", ")}</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                                    <span>Past: {patient.summary.pastConditions.join(", ")}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No diagnosed conditions on record.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <Button
                onClick={() => navigate(`/doctor/diagnose/${patient.id}`)}
                className="w-full h-14 text-lg font-bold bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
                <Stethoscope size={22} /> Diagnose Patient
            </Button>

            {/* Medical History */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-lg font-bold text-slate-900">Patient History</h3>
                    <Button variant="ghost" size="sm" className="text-blue-600 text-xs">View All</Button>
                </div>

                <div className="space-y-4">
                    {patient.history.length > 0 ? (
                        patient.history.map(record => (
                            <Card key={record.id} className="p-4 border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-base">{record.diagnosis}</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            {record.doctor} {record.isSelf && <span className="text-blue-600">(You)</span>}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{record.hospital}</p>
                                    </div>
                                    <Badge variant={record.status === 'Active' ? 'default' : 'secondary'} className={record.status === 'Active' ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                                        {record.status}
                                    </Badge>
                                </div>

                                    <div className="bg-slate-50 rounded-lg p-3 text-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Details</p>
                                        <p className="text-slate-600 text-sm mb-2">{record.notes}</p>
                                        {record.symptoms && record.symptoms.length > 0 && (
                                            <div className="mb-2 flex gap-1 flex-wrap">
                                                {record.symptoms.map((sym, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-[10px] bg-white">{sym}</Badge>
                                                ))}
                                            </div>
                                        )}
                                        {record.medicines && record.medicines.length > 0 && (
                                            <>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 mt-3">Prescription</p>
                                                <ul className="space-y-1">
                                                    {record.medicines.map((med, idx) => (
                                                        <li key={idx} className="flex items-center gap-2 text-slate-700">
                                                            <CheckCircle2 size={12} className="text-slate-400" /> {med}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                        <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400">{record.date}</span>
                                        {/* Mock Signature */}
                                        <div className="text-[10px] font-handwriting text-slate-600 italic">Signed: {record.doctor}</div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
                            <p>No medical history available.</p>
                        </div>
                    )}
                </div>
            </div>

        </PageTransition>
    );
};

export default PatientDetailsPage;
