//apps/ai-lab/src/features/auth/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../../api/auth';
import Logo from '../../../components/Logo';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

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
    <div className="flex min-h-screen items-center justify-center bg-fog p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
        <div className="mb-6 flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <span className="font-display text-lg font-medium text-ink">ASILLIA AI Lab</span>
        </div>
        <p className="mb-6 text-sm text-neutral-500">
          Connectez-vous pour débloquer les fonctionnalités Premium.
        </p>

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

          <Button type="submit" loading={loading} className="w-full">
            Se connecter
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Pas de compte ? <Link to="/signup" className="font-medium text-ink underline">Inscrivez-vous</Link>
        </p>
        <p className="mt-2 text-center text-xs text-neutral-400">
          <Link to="/" className="underline">Continuer sans compte</Link>
        </p>
      </div>
    </div>
  );
}