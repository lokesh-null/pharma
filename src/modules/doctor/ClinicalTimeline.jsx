import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Lock, ChevronDown, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const TimelineEvent = ({ date, title, doctor, verified, locked = false }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="relative pl-6 pb-8 border-l-2 border-slate-100 last:border-0 last:pb-0">
            <div className={cn(
                "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                verified ? "bg-teal-500" : "bg-slate-300"
            )} />

            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar size={10} /> {date}
                </span>

                <div className={cn(
                    "group p-3 rounded-xl border transition-all cursor-pointer",
                    locked ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100 hover:border-teal-200 hover:shadow-sm"
                )} onClick={() => !locked && setExpanded(!expanded)}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-medium text-slate-900 text-sm">{title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{doctor}</p>
                        </div>
                        {locked ? (
                            <Lock size={14} className="text-slate-400" />
                        ) : (
                            <ChevronDown size={14} className={cn("text-slate-400 transition-transform", expanded && "rotate-180")} />
                        )}
                    </div>

                    <AnimatePresence>
                        {expanded && !locked && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className="text-[10px]">Fever</Badge>
                                        <Badge variant="secondary" className="text-[10px]">Cough</Badge>
                                    </div>
                                    <p>Prescribed: Paracetamol, Cetirizine</p>
                                    <div className="flex items-center gap-1 text-teal-600 font-medium">
                                        <FileText size={10} />
                                        <span>View Report</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {locked && (
                        <div className="mt-2 filter blur-[2px] select-none opacity-50 text-xs">
                            Prescription details hidden due to privacy settings.
                        </div>
                    )}

                    {locked && (
                        <div className="mt-2 flex justify-center">
                            <Button size="sm" variant="outline" className="h-6 text-[10px] w-full bg-white">Request Access</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClinicalTimeline = () => {
    return (
        <Card className="h-full border-0 shadow-sm bg-white/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between text-teal-900">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-teal-600" />
                        Clinical History
                    </div>
                    <Badge variant="outline" className="font-normal text-[10px]">Last 6 Months</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mt-8 flex flex-col items-center justify-center text-center text-slate-400">
                    <Activity size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No clinical history available</p>
                    <p className="text-xs mt-1 max-w-[200px]">Scan a patient's PharmaLync ID or QR code to view their medical timeline.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ClinicalTimeline;
