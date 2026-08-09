// apps/studio/src/routes/AppRouter.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentSession, type AdminSession } from '../api/auth';

interface AuthState {
  session: AdminSession | null;
  loading: boolean;
}

// --- Placeholders temporaires --------------------------------------------
// Ces composants seront remplacés par les vraies pages (features/auth,
// features/tenants, features/studio, features/reports) dans la prochaine étape.
function LoginPagePlaceholder() {
  return <div className="p-8">Page de connexion — à brancher (features/auth/pages/LoginPage.tsx)</div>;
}
function StudioPagePlaceholder() {
  return <div className="p-8">Écran d'analyse — à brancher (features/studio/pages/StudioPage.tsx)</div>;
}
// ---------------------------------------------------------------------------

/**
 * Protège toutes les routes internes : vérifie la session ET l'appartenance
 * à Team "admins" ou "analysts" via getCurrentSession(). Redirige vers /login
 * si l'utilisateur n'est pas authentifié ou n'a pas la bonne Team.
 */
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
        <Route path="/login" element={<LoginPagePlaceholder />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <StudioPagePlaceholder />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}