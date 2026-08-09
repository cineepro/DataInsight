// apps/studio/src/api/auth.ts
import { account, teams } from './appwrite';
import { TEAMS } from '@datainsight/shared';

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isAnalyst: boolean;
}

/**
 * Connexion réservée aux comptes créés manuellement par un admin
 * (console Appwrite ou script de seed). Aucune inscription libre
 * (self-signup) n'est exposée dans cette app.
 */
export async function login(email: string, password: string): Promise<AdminSession> {
  await account.createEmailPasswordSession(email, password);
  return getCurrentSession();
}

export async function logout(): Promise<void> {
  await account.deleteSession('current');
}

/**
 * Vérifie la session ET l'appartenance à une Team autorisée.
 * Si le compte est authentifié mais n'appartient à aucune Team
 * (admins/analysts), la session est immédiatement détruite.
 */
export async function getCurrentSession(): Promise<AdminSession> {
  const user = await account.get();
  const membership = await teams.list();

  const teamIds = membership.teams.map((t) => t.$id);
  const isAdmin = teamIds.includes(TEAMS.ADMINS);
  const isAnalyst = teamIds.includes(TEAMS.ANALYSTS);

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