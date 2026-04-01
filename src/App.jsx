import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MFASetupPage from './pages/MFASetupPage';
import OTPVerifyPage from './pages/OTPVerifyPage';
import DashboardPage from './pages/DashboardPage';
import PasswordResetPage from './pages/PasswordResetPage';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <main style={{ flex: 1 }}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/reset-password" element={<PasswordResetPage />} />

                            {/* 2FA flow routes (require partial-auth session) */}
                            <Route path="/verify-otp" element={<OTPVerifyPage />} />
                            <Route path="/mfa-setup" element={<MFASetupPage />} />

                            {/* Protected routes */}
                            <Route path="/dashboard" element={
                                <PrivateRoute>
                                    <DashboardPage />
                                </PrivateRoute>
                            } />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
