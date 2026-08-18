//apps/showcase/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './features/home/pages/HomePage';
import ProductPage from './features/product/pages/ProductPage';
import AnnouncementsPage from './features/announcements/pages/AnnouncementsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/produit" element={<ProductPage />} />
        <Route path="/actualites" element={<AnnouncementsPage />} />
        {/* /secteurs, /documentation, /tarifs, /a-propos, /contact — prochain message */}
      </Routes>
    </BrowserRouter>
  );
}