import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DeliveryPage } from './pages/DeliveryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { TransfersPage } from './pages/TransfersPage';
import { AdjustmentsPage } from './pages/AdjustmentsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
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
          <Route
            path="/move-history"
            element={
              <PlaceholderPage
                title="Stock Move History"
                section="Audit"
                description="Complete immutable ledger of all product movements, timestamps, handlers, and audit trails."
                icon="history"
              />
            }
          />
          <Route
            path="/settings"
            element={
              <PlaceholderPage
                title="System Settings"
                section="Configuration"
                description="Configure warehouse nodes, gate telemetry sensors, user roles, and barcode standards."
                icon="settings"
              />
            }
          />
          <Route
            path="/profile"
            element={
              <PlaceholderPage
                title="Operator Profile"
                section="Account"
                description="User profile, credentials, security keys, shift schedules, and dock assignments."
                icon="person"
              />
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/operations/deliveries" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
