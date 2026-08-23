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

export async function getCurrentAiLabSession(): Promise<AiLabSession | null> {
  let user;
  try {
    user = await account.get();
  } catch {
    return null; // pas de session active — cas normal, silence attendu ici
  }

  // À partir d'ici, la session Appwrite existe bel et bien — toute erreur
  // qui suit est un VRAI problème (config, permissions) qu'il ne faut plus
  // masquer silencieusement.
  try {
    const accountDoc = await getOrCreateAccountDoc(user.$id, user.email);
    return { userId: user.$id, email: user.email, account: accountDoc };
  } catch (err) {
    console.error('Erreur lors de la récupération/création du compte ai_lab_accounts:', err);
    throw err; // remonte l'erreur réelle au lieu de retourner null silencieusement
  }
}

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
    [Permission.read(Role.user(userId))]
  );

  return created as unknown as AiLabAccount;
}

/**
 * Détruit toute session résiduente AVANT de tenter d'en créer une nouvelle.
 * Nécessaire car tes différentes apps (studio, client-dashboard, ai-lab...)
 * partagent le même projet Appwrite — une session ouverte ailleurs (ex: ton
 * compte admin Studio, dans un autre onglet) peut sinon entrer en conflit
 * ici, avec l'erreur "Creation of a session is prohibited when a session
 * is active".
 */
async function clearAnyExistingSession(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch {
    // Pas de session active — comportement normal, rien à faire.
  }
}

export async function signup(email: string, password: string, name: string): Promise<AiLabSession> {
  await clearAnyExistingSession();

  try {
    await account.create(ID.unique(), email, password, name);
  } catch (err: any) {
    if (err?.code === 409) {
      throw new Error(
        'Cet email est déjà utilisé pour un autre compte ASILLIA. Utilisez un email différent, ou connectez-vous si ce compte vous appartient déjà.'
      );
    }
    throw err;
  }

  await account.createEmailPasswordSession(email, password);
  const session = await getCurrentAiLabSession();
  if (!session) throw new Error('Erreur lors de la création du compte.');
  return session;
}

export async function login(email: string, password: string): Promise<AiLabSession> {
  await clearAnyExistingSession();

  try {
    await account.createEmailPasswordSession(email, password);
  } catch (err: any) {
    if (err?.code === 401) {
      throw new Error('Email ou mot de passe incorrect.');
    }
    throw err;
  }

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