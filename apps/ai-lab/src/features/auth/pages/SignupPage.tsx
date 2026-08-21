//apps/ai-lab/src/features/auth/pages/SignupPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../../../api/auth';
import Logo from '../../../components/Logo';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
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
          Créez un compte gratuit — l'accès Premium reste optionnel, activé sur demande.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          {error && <p className="text-sm text-brick">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            Créer mon compte
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Déjà inscrit ? <Link to="/login" className="font-medium text-ink underline">Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
}