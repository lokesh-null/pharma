import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming exists, if not using standard textarea
import { Card } from '@/components/ui/card';
import { Activity, ArrowRight, Save } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';

import { toast } from '@/lib/toast';

const DiagnosisPage = () => {
    const { id } = useParams(); // Patient ID
    const navigate = useNavigate();
    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');

    const handleSaveAndProceed = () => {
        if (!diagnosis) {
            toast.warning("Please enter a diagnosis.");
            return;
        }
        navigate(`/doctor/prescription/${id}`);
    };

    return (
        <PageTransition className="px-5 py-6 space-y-6">
            <div className="mb-6">
                <p className="text-sm font-bold text-slate-400 uppercase">Step 1 of 2</p>
                <h1 className="text-2xl font-bold text-slate-900">Diagnosis & Vitals</h1>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500" />
                        Reason for Visit / Symptoms
                    </label>
                    <textarea
                        className="w-full min-h-[100px] p-4 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 resize-none shadow-sm"
                        placeholder="e.g. Severe headache since 2 days, Nausea..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Detailed Diagnosis</label>
                    <textarea
                        className="w-full min-h-[120px] p-4 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 resize-none shadow-sm font-medium"
                        placeholder="e.g. Migraine without aura (G43.0)"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                    />
                </div>

                <Card className="p-4 bg-yellow-50/50 border-yellow-100">
                    <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2">Note</h4>
                    <p className="text-sm text-yellow-800">This diagnosis will be recorded in the patient's permanent medical history.</p>
                </Card>
            </div>

            <div className="fixed bottom-20 left-0 w-full px-6 py-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
                <Button
                    onClick={handleSaveAndProceed}
                    className="w-full max-w-md mx-auto h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg"
                >
                    Proceed to Prescription <ArrowRight className="ml-2" size={18} />
                </Button>
            </div>
        </PageTransition>
    );
};

export default DiagnosisPage;
