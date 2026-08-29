//apps/showcase/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './features/home/pages/HomePage';
import ProductPage from './features/product/pages/ProductPage';
import SectorsPage from './features/sectors/pages/SectorsPage';
import DocumentationPage from './features/documentation/pages/DocumentationPage';
import AnnouncementsPage from './features/announcements/pages/AnnouncementsPage';
import PricingPage from './features/pricing/pages/PricingPage';
import AboutPage from './features/about/pages/AboutPage';
import ContactPage from './features/contact/pages/ContactPage';
import DevelopersPage from './features/developers/pages/DevelopersPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/produit" element={<ProductPage />} />
        <Route path="/secteurs" element={<SectorsPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/actualites" element={<AnnouncementsPage />} />
        <Route path="/tarifs" element={<PricingPage />} />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/developpeurs" element={<DevelopersPage />} />
      </Routes>
    </BrowserRouter>
  );
}