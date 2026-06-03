import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const mockUsers = [];

const UserManagementPage = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage staff access and roles across the hospital network.</p>
                </div>
                <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 w-full sm:w-auto">
                    <UserPlus size={16} />
                    Add New User
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4 border-b border-slate-100">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input 
                            placeholder="Search by name or email..." 
                            className="pl-9 h-10 bg-slate-50 border-slate-200" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-6">Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {filteredUsers.map((user) => (
                                    <motion.tr 
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                    >
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{user.name}</span>
                                                    <span className="text-xs text-slate-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">{user.department}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-400'}`} />
                                                <span className="text-sm font-medium text-slate-700">{user.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50">
                                                    <Edit size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        No users found matching your search.
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

export default UserManagementPage;
