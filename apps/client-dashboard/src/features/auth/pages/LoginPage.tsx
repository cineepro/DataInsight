// apps/client-dashboard/src/features/auth/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../api/auth';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
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
      setError('Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-statement p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <span className="font-display text-lg font-medium text-ink">ASILLIA</span>
        </div>
        <h1 className="mb-1 font-display text-xl font-medium text-ink">Mon espace</h1>
        <p className="mb-6 text-sm text-neutral-500">Consultez vos rapports hebdomadaires</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-brick">{error}</p>}

          <Button type="submit" loading={loading} className="mt-2 w-full">
            Se connecter
          </Button>
        </form>
      </Card>
    </div>
  );
}