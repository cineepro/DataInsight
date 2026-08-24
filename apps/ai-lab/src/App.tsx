//apps/ai-lab/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './features/chat/pages/ChatPage';
import LoginPage from './features/auth/pages/LoginPage';
import SignupPage from './features/auth/pages/SignupPage';
import HistoryPage from './features/history/pages/HistoryPage';
import SourcesPage from './features/sources/pages/SourcesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/sources" element={<SourcesPage />} />
      </Routes>
    </BrowserRouter>
  );
}