// apps/studio/src/features/auth/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../api/auth';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Logo from '../../../components/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Identifiants invalides ou compte non autorisé.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fog p-4">
      <div className="w-full max-w-sm border border-neutral-200 bg-white p-8">
        <div className="mb-6 flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <span className="font-display text-lg font-medium text-ink">ASILLIA Studio</span>
        </div>
        <p className="mb-6 text-sm text-neutral-500">Accès réservé aux administrateurs et analystes</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-brick">{error}</p>}

          <Button type="submit" loading={loading} className="mt-2 w-full">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}