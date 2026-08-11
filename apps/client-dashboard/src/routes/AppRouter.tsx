// apps/client-dashboard/src/routes/AppRouter.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentSession, type ClientSession } from '../api/auth';
import LoginPage from '../features/auth/pages/LoginPage';
import ClientReportsPage from '../features/reports/pages/ClientReportsPage';

interface AuthState {
  session: ClientSession | null;
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
          path="/*"
          element={
            <ProtectedRoute>
              <ClientReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}