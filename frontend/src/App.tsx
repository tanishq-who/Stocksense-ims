import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { TransfersPage } from './pages/TransfersPage';
import { AdjustmentsPage } from './pages/AdjustmentsPage';
import { MoveHistoryPage } from './pages/MoveHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect to Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Implemented Core Screens */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/operations/deliveries" element={<DeliveryPage />} />
            <Route path="/deliveries" element={<Navigate to="/operations/deliveries" replace />} />
            <Route path="/operations/receipts" element={<ReceiptsPage />} />
            <Route path="/receipts" element={<Navigate to="/operations/receipts" replace />} />
            <Route path="/operations/transfers" element={<TransfersPage />} />
            <Route path="/transfers" element={<Navigate to="/operations/transfers" replace />} />
            <Route path="/operations/adjustments" element={<AdjustmentsPage />} />
            <Route path="/adjustments" element={<Navigate to="/operations/adjustments" replace />} />
            <Route
              path="/operations"
              element={<Navigate to="/operations/deliveries" replace />}
            />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/move-history" element={<MoveHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
