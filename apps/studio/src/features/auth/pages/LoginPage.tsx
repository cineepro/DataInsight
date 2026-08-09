//apps/studio/src/features/auth/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../api/auth';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

// Pas d'inscription libre ici : les comptes admin/analyste sont créés
// manuellement dans la console Appwrite (ou via un script de seed) puis
// ajoutés à la Team "admins" ou "analysts".
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-lg font-semibold text-neutral-900">ASILLIA Studio</h1>
        <p className="mb-6 text-sm text-neutral-500">Accès réservé aux administrateurs et analystes</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            Se connecter
          </Button>
        </form>
      </Card>
    </div>
  );
}