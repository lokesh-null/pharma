import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/Toaster';
import { PageLoader } from './components/ui/Skeleton';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import PharmacistLayout from './layouts/PharmacistLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages (Loaded eagerly for fast first paint)
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import CreatePasswordPage from './pages/auth/CreatePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Lazy loaded modules
const PatientDashboard = lazy(() => import('./modules/patient'));
const PatientProfile = lazy(() => import('./modules/patient/ProfilePage'));
const MedicineLog = lazy(() => import('./modules/patient/MedicineLog'));
const PrescriptionsPage = lazy(() => import('./modules/patient/pages/PrescriptionsPage'));

const DoctorRegistration = lazy(() => import('./modules/doctor/pages/DoctorRegistration'));
const ScanQRPage = lazy(() => import('./modules/doctor/pages/ScanQRPage'));
const PatientDetailsPage = lazy(() => import('./modules/doctor/pages/PatientDetailsPage'));
const DiagnosisPage = lazy(() => import('./modules/doctor/pages/DiagnosisPage'));
const DraftPrescriptionPage = lazy(() => import('./modules/doctor/pages/DraftPrescriptionPage'));
const ActivityLogPage = lazy(() => import('./modules/doctor/pages/ActivityLogPage'));
const DoctorProfilePage = lazy(() => import('./modules/doctor/pages/DoctorProfilePage'));

const ScanQR = lazy(() => import('./modules/pharmacist/pages/ScanQR'));
const DispensePage = lazy(() => import('./modules/pharmacist/pages/DispensePage'));
const Stock = lazy(() => import('./modules/pharmacist/pages/Stock'));
const HistoryPage = lazy(() => import('./modules/pharmacist/pages/History'));
const Profile = lazy(() => import('./modules/pharmacist/pages/Profile'));

const AdminDashboard = lazy(() => import('./modules/admin/pages/DashboardPage'));
const AuditLogPage = lazy(() => import('./modules/admin/pages/AuditLogPage'));
const UserManagementPage = lazy(() => import('./modules/admin/pages/UserManagementPage'));

function App() {
    return (
        <ThemeProvider>
            <Toaster />
            <BrowserRouter>
                <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* Public Routes */}
                            <Route element={<AuthLayout />}>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/signup" element={<SignupPage />} />
                                <Route path="/create-password" element={<CreatePasswordPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                <Route path="/reset-password" element={<ResetPasswordPage />} />
                                <Route path="/" element={<Navigate to="/login" replace />} />
                            </Route>

                            {/* Patient Routes */}
                            <Route element={
                                <ProtectedRoute allowedRoles={['PATIENT']}>
                                    <PatientLayout />
                                </ProtectedRoute>
                            }>
                                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                                <Route path="/patient/medicine-log" element={<MedicineLog />} />
                                <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
                                <Route path="/patient/profile" element={<PatientProfile />} />
                            </Route>

                            {/* Doctor Routes (Requires ADMIN or NURSE) */}
                            <Route path="/doctor/register" element={<DoctorRegistration />} />
                            <Route element={
                                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                                    <DoctorLayout />
                                </ProtectedRoute>
                            }>
                                <Route path="/doctor/dashboard" element={<Navigate to="/doctor/scan" replace />} />
                                <Route path="/doctor/scan" element={<ScanQRPage />} />
                                <Route path="/doctor/patient/:id" element={<PatientDetailsPage />} />
                                <Route path="/doctor/diagnose/:id" element={<DiagnosisPage />} />
                                <Route path="/doctor/prescription/:id" element={<DraftPrescriptionPage />} />
                                <Route path="/doctor/activity" element={<ActivityLogPage />} />
                                <Route path="/doctor/profile" element={<DoctorProfilePage />} />
                            </Route>

                            {/* Pharmacist Routes (Requires PHARMACY or ADMIN) */}
                            <Route element={
                                <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']}>
                                    <PharmacistLayout />
                                </ProtectedRoute>
                            }>
                                <Route path="/pharmacist" element={<Navigate to="/pharmacist/scan" replace />} />
                                <Route path="/pharmacist/scan" element={<ScanQR />} />
                                <Route path="/pharmacist/dispense" element={<DispensePage />} />
                                <Route path="/pharmacist/stock" element={<Stock />} />
                                <Route path="/pharmacist/history" element={<HistoryPage />} />
                                <Route path="/pharmacist/profile" element={<Profile />} />
                            </Route>

                            {/* Admin Routes (Requires ADMIN) */}
                            <Route element={
                                <ProtectedRoute allowedRoles={['ADMIN']}>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }>
                                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/users" element={<UserManagementPage />} />
                                <Route path="/admin/audit" element={<AuditLogPage />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
