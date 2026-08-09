//apps/studio/src/api/auth.ts
import { account, teams } from './appwrite';
import { TEAMS } from '@datainsight/shared';

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isAnalyst: boolean;
}

export async function login(email: string, password: string): Promise<AdminSession> {
  await account.createEmailPasswordSession(email, password);
  return getCurrentSession();
}

export async function logout(): Promise<void> {
  await account.deleteSession('current');
}

/**
 * Vérifie la session ET l'appartenance à une Team autorisée.
 * IMPORTANT : on compare par NOM de Team (t.name), pas par $id.
 * $id est l'identifiant technique généré par Appwrite (ex: 6a783ee500329933a88e),
 * totalement différent du nom affiché "admins" dans la console.
 */
export async function getCurrentSession(): Promise<AdminSession> {
  const user = await account.get();
  const membership = await teams.list();

  const teamNames = membership.teams.map((t) => t.name);
  const isAdmin = teamNames.includes(TEAMS.ADMINS);
  const isAnalyst = teamNames.includes(TEAMS.ANALYSTS);

  if (!isAdmin && !isAnalyst) {
    await account.deleteSession('current');
    throw new Error("Accès refusé : ce compte n'appartient à aucune équipe autorisée.");
  }

  return {
    userId: user.$id,
    email: user.email,
    name: user.name,
    isAdmin,
    isAnalyst,
  };
}