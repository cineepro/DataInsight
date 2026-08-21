//apps/ai-lab/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './features/chat/pages/ChatPage';
import LoginPage from './features/auth/pages/LoginPage';
import SignupPage from './features/auth/pages/SignupPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Le chat reste accessible sans compte — c'est le coeur du modèle gratuit */}
        <Route path="/" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}