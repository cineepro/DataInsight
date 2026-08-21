//apps/ai-lab/src/api/auth.ts
import { ID, Query, Permission, Role } from 'appwrite';
import { account, databases } from './client';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_AI_LAB_ACCOUNTS = import.meta.env.VITE_COLLECTION_AI_LAB_ACCOUNTS;

export interface AiLabAccount {
  $id: string;
  user_id: string;
  email: string;
  plan: 'FREE' | 'PREMIUM';
  daily_question_limit: number;
  premium_expires_at?: string;
}

export interface AiLabSession {
  userId: string;
  email: string;
  account: AiLabAccount | null;
}

/**
 * Contrairement au reste du système, cette fonction ne lève JAMAIS
 * d'erreur si personne n'est connecté — elle retourne simplement `null`.
 * C'est ce qui garantit que le chat gratuit continue de fonctionner sans
 * aucune friction pour un visiteur qui ne s'est jamais inscrit.
 */
export async function getCurrentAiLabSession(): Promise<AiLabSession | null> {
  try {
    const user = await account.get();
    const accountDoc = await getOrCreateAccountDoc(user.$id, user.email);
    return { userId: user.$id, email: user.email, account: accountDoc };
  } catch {
    return null; // pas de session active — comportement normal pour un visiteur anonyme
  }
}

// ... (reste du fichier identique) ...

async function getOrCreateAccountDoc(userId: string, email: string): Promise<AiLabAccount> {
  const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_AI_LAB_ACCOUNTS, [
    Query.equal('user_id', userId),
    Query.limit(1),
  ]);

  if (existing.documents.length > 0) {
    return existing.documents[0] as unknown as AiLabAccount;
  }

  const created = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_AI_LAB_ACCOUNTS,
    ID.unique(),
    {
      user_id: userId,
      email,
      plan: 'FREE',
      daily_question_limit: 5,
      created_at: new Date().toISOString(),
    },
    [
      Permission.read(Role.user(userId)), // le propriétaire peut consulter son propre plan
      // Volontairement AUCUN Permission.update ici pour le propriétaire —
      // seule une clé API serveur ou un admin (team:admins, déjà accordé
      // au niveau collection) peut faire évoluer le plan vers PREMIUM.
    ]
  );

  return created as unknown as AiLabAccount;
}

export async function signup(email: string, password: string, name: string): Promise<AiLabSession> {
  await account.create(ID.unique(), email, password, name);
  await account.createEmailPasswordSession(email, password);
  const session = await getCurrentAiLabSession();
  if (!session) throw new Error('Erreur lors de la création du compte.');
  return session;
}

export async function login(email: string, password: string): Promise<AiLabSession> {
  await account.createEmailPasswordSession(email, password);
  const session = await getCurrentAiLabSession();
  if (!session) throw new Error('Erreur lors de la connexion.');
  return session;
}

export async function logout(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch {
    // pas de session active, rien à faire
  }
}