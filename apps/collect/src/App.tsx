import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RestaurantForm from './features/restaurant/RestaurantForm';
import PharmacieForm from './features/pharmacie/PharmacieForm';
import EntrepriseForm from './features/entreprise/EntrepriseForm';

// Aucune route /admin, /login ou /dashboard n'existe dans cette app.
// Ce routeur ne connaît QUE les 3 formulaires de collecte.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/r/:slug" element={<RestaurantForm />} />
        <Route path="/p/:slug" element={<PharmacieForm />} />
        <Route path="/e/:slug" element={<EntrepriseForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route
          path="/"
          element={
            <div className="flex min-h-screen items-center justify-center p-6 text-center text-neutral-500">
              Lien invalide. Merci de scanner le QR Code affiché sur place.
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}