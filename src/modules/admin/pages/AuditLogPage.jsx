import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockLogs = [];

const AuditLogPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
                    <p className="text-sm text-slate-500 mt-1">Immutable record of all system events and transactions.</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    Filter Logs
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Event History</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input placeholder="Search logs..." className="pl-9 h-9 text-sm" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>User / IP</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{log.time}</TableCell>
                                    <TableCell className="font-medium">{log.action}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{log.user}</span>
                                            <span className="text-xs text-slate-400">{log.ip}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-slate-600 bg-slate-50">{log.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={log.status === 'Success' ? 'success' : 'destructive'} className={log.status === 'Success' ? 'bg-teal-50 text-teal-700 border-teal-200' : ''}>
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {mockLogs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        No audit logs available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditLogPage;
