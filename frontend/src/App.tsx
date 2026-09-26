import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DeliveryPage } from './pages/DeliveryPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Default redirect to Delivery operations for Milestone 1 */}
          <Route path="/" element={<Navigate to="/operations/deliveries" replace />} />

          {/* Core Milestone 1 Implemented Screen */}
          <Route path="/operations/deliveries" element={<DeliveryPage />} />
          <Route path="/deliveries" element={<Navigate to="/operations/deliveries" replace />} />

          {/* Placeholders for future milestones */}
          <Route
            path="/dashboard"
            element={
              <PlaceholderPage
                title="StockSense Dashboard"
                section="Overview"
                description="Live real-time metrics, telemetry graphs, and warehouse node activity feeds."
                icon="dashboard"
              />
            }
          />
          <Route
            path="/operations"
            element={<Navigate to="/operations/deliveries" replace />}
          />
          <Route
            path="/operations/receipts"
            element={
              <PlaceholderPage
                title="Inbound Receipts"
                section="Operations"
                description="Manage incoming purchase orders, dock staging, supplier receipts, and pallet intake."
                icon="call_received"
              />
            }
          />
          <Route
            path="/operations/transfers"
            element={
              <PlaceholderPage
                title="Internal Transfers"
                section="Operations"
                description="Move inventory units between aisles, storage zones, cold vaults, and fulfillment docks."
                icon="swap_horiz"
              />
            }
          />
          <Route
            path="/operations/adjustments"
            element={
              <PlaceholderPage
                title="Inventory Adjustments"
                section="Operations"
                description="Perform cycle counts, damage reconciliations, lot audits, and variance logs."
                icon="rule"
              />
            }
          />
          <Route
            path="/products"
            element={
              <PlaceholderPage
                title="Product Catalog & SKUs"
                section="Inventory"
                description="Manage master catalog items, barcode tracking, safety stock levels, and valuations."
                icon="category"
              />
            }
          />
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
