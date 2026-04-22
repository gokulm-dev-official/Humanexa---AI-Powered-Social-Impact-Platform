import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CreateRequestPage from './pages/CreateRequestPage'
import LiveImpactPage from './pages/LiveImpactPage'
import CertificatesPage from './pages/CertificatesPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import InstitutionDashboard from './pages/InstitutionDashboard'
import { Navbar as AppNavbar } from './components/design-system/Navbar'
import SplashScreen from './components/SplashScreen'
import EmergencySignalPage from './pages/EmergencySignalPage'
import HelperEmergencyPage from './pages/HelperEmergencyPage'
import DonationTypePage from './pages/DonationTypePage'
import DonorDiscoveryPage from './pages/DonorDiscoveryPage'
import DonationHistoryPage from './pages/DonationHistoryPage'
import DonationSuccessPage from './pages/DonationSuccessPage'
import HelperVerificationPage from './pages/HelperVerificationPage'
import HelperCountdownPage from './pages/HelperCountdownPage'
import DonorProofPage from './pages/DonorProofPage'
import RateHelperPage from './pages/RateHelperPage'
import HelperProfilePage from './pages/HelperProfilePage'
import HelperCertificationPage from './pages/HelperCertificationPage'
import HelperTrainingPage from './pages/HelperTrainingPage'
import BloodDonationPage from './pages/BloodDonationPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminEscrowPage from './pages/AdminEscrowPage'
import InstitutionDiscoveryPage from './pages/InstitutionDiscoveryPage'
import { AICommandHub } from './components/ai/AICommandHub'
import MotivationSlogan from './components/MotivationSlogan'

function App() {
    const { isAuthenticated, isDonor, isHelper, isInstitution, isAdmin, user } = useAuth();
    const location = useLocation();
    const [showSplash, setShowSplash] = useState(true);
    const [showSlogan, setShowSlogan] = useState(false);

    // Pages that should be full-screen without the main navbar
    const isFullScreenPage = location.pathname === '/live-impact';
    // Institution dashboard has its own layout
    const isInstitutionPage = isAuthenticated && isInstitution && location.pathname === '/dashboard';
    // Login and register pages should not show navbar
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/admin-login';

    if (showSplash) {
        return <SplashScreen onComplete={() => { setShowSplash(false); setShowSlogan(true); }} />;
    }

    if (showSlogan) {
        return <MotivationSlogan onComplete={() => setShowSlogan(false)} />;
    }

    // Dashboard component selector based on role
    const getDashboard = () => {
        if (isInstitution) return <InstitutionDashboard />;
        // donor and helper both use the same DashboardPage for now
        return <DashboardPage />;
    };

    return (
        <div className="bg-background min-h-screen">
            {!isFullScreenPage && !isInstitutionPage && !isAuthPage && <AppNavbar />}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={isAuthenticated ? getDashboard() : <Navigate to="/login" />} />
                <Route path="/create-request" element={isAuthenticated ? <CreateRequestPage /> : <Navigate to="/login" />} />
                <Route path="/live-impact" element={isAuthenticated ? <LiveImpactPage /> : <Navigate to="/login" />} />
                <Route path="/certificates" element={isAuthenticated ? <CertificatesPage /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
                <Route path="/admin" element={isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin') ? <AdminDashboardPage /> : <Navigate to="/dashboard" />} />
                <Route path="/emergency" element={isAuthenticated ? <EmergencySignalPage /> : <Navigate to="/login" />} />
                <Route path="/emergency/track/:alertId" element={isAuthenticated ? <EmergencySignalPage /> : <Navigate to="/login" />} />
                <Route path="/helper/emergency" element={isAuthenticated ? <HelperEmergencyPage /> : <Navigate to="/login" />} />
                <Route path="/helper/emergency/respond/:alertId" element={isAuthenticated ? <HelperEmergencyPage /> : <Navigate to="/login" />} />
                <Route path="/donate" element={isAuthenticated ? <DonationTypePage /> : <Navigate to="/login" />} />
                <Route path="/discovery" element={isAuthenticated ? <DonorDiscoveryPage /> : <Navigate to="/login" />} />
                <Route path="/donation-history" element={isAuthenticated ? <DonationHistoryPage /> : <Navigate to="/login" />} />
                {/* Feature 1: Donation Success with Receipt */}
                <Route path="/donation-success" element={isAuthenticated ? <DonationSuccessPage /> : <Navigate to="/login" />} />
                {/* Feature 2: Photo Verification */}
                <Route path="/helper/verify" element={isAuthenticated ? <HelperVerificationPage /> : <Navigate to="/login" />} />
                {/* Feature 3: 30-min Countdown */}
                <Route path="/helper/task/:taskId" element={isAuthenticated ? <HelperCountdownPage /> : <Navigate to="/login" />} />
                {/* Feature 4: Proof Photos for Donors */}
                <Route path="/proof/:requestId" element={isAuthenticated ? <DonorProofPage /> : <Navigate to="/login" />} />
                {/* Feature 6: Rate Helper */}
                <Route path="/rate-helper" element={isAuthenticated ? <RateHelperPage /> : <Navigate to="/login" />} />
                {/* Feature 6: Helper Profile */}
                <Route path="/helper/profile/:helperId" element={<HelperProfilePage />} />
                {/* Feature 7: Certification */}
                <Route path="/certification" element={isAuthenticated ? <HelperCertificationPage /> : <Navigate to="/login" />} />
                {/* Feature 7: Training */}
                <Route path="/training" element={isAuthenticated ? <HelperTrainingPage /> : <Navigate to="/login" />} />
                {/* Blood Donation */}
                <Route path="/blood-donation" element={isAuthenticated ? <BloodDonationPage /> : <Navigate to="/login" />} />
                {/* Admin Login */}
                <Route path="/admin-login" element={<AdminLoginPage />} />
                {/* Admin Escrow Management */}
                <Route path="/admin/escrow" element={(isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin' || user?.email === 'gokulpersonal64@gmail.com')) || localStorage.getItem('adminAuth') === 'true' ? <AdminEscrowPage /> : <Navigate to="/admin-login" />} />
                {/* Institution Discovery */}
                <Route path="/institutions" element={isAuthenticated ? <InstitutionDiscoveryPage /> : <Navigate to="/login" />} />
            </Routes>
            {/* AI Command Hub — Global floating AI assistant */}
            {isAuthenticated && !isAuthPage && <AICommandHub />}
        </div>
    )
}

export default App
