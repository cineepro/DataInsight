// apps/collect/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RestaurantForm from './features/restaurant/RestaurantForm';
import PharmacieForm from './features/pharmacie/PharmacieForm';
import EntrepriseForm from './features/entreprise/EntrepriseForm';

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
            <div className="flex min-h-screen items-center justify-center bg-ticket p-6 text-center">
              <p className="font-mono text-sm text-neutral-400">
                Lien invalide. Merci de scanner le QR Code affiché sur place.
              </p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}