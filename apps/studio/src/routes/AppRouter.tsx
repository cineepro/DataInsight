//apps/studio/src/routes/AppRouter.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentSession, type AdminSession } from '../api/auth';

import Layout from '../components/Layout';
import LoginPage from '../features/auth/pages/LoginPage';
import StudioPage from '../features/studio/pages/StudioPage';
import TenantsAdminPage from '../features/tenants/pages/TenantsAdminPage';
import ReportsHistoryPage from '../features/studio/reports/pages/ReportsHistoryPage';

import CustomersPage from '../features/customers/pages/CustomersPage';
import BillingPage from '../features/billing/pages/BillingPage';
import AlertsPage from '../features/alerts/pages/AlertsPage';

interface AuthState {
  session: AdminSession | null;
  loading: boolean;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    getCurrentSession()
      .then((session) => setAuth({ session, loading: false }))
      .catch(() => setAuth({ session: null, loading: false }));
  }, []);

  if (auth.loading) {
    return <div className="flex min-h-screen items-center justify-center text-neutral-400">Vérification...</div>;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<StudioPage />} />
          <Route path="/tenants" element={<TenantsAdminPage />} />
          <Route path="/reports" element={<ReportsHistoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}