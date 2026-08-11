// apps/client-dashboard/src/api/auth.ts
import { account, teams } from './appwrite';

export interface ClientSession {
  userId: string;
  email: string;
  tenantSlug: string; // extrait du nom de Team "tenant_<slug>"
}

export async function login(email: string, password: string): Promise<ClientSession> {
  await account.createEmailPasswordSession(email, password);
  return getCurrentSession();
}

export async function logout(): Promise<void> {
  await account.deleteSession('current');
}

/**
 * Un compte gérant appartient à UNE SEULE Team "tenant_<slug>" (créée par
 * provision-tenant-access). On en extrait le slug pour filtrer les rapports
 * accessibles — pas besoin de connaître le tenant_id à l'avance.
 */
export async function getCurrentSession(): Promise<ClientSession> {
  const user = await account.get();
  const membership = await teams.list();

  const tenantTeam = membership.teams.find((t) => t.name.startsWith('tenant_'));

  if (!tenantTeam) {
    await account.deleteSession('current');
    throw new Error("Ce compte n'est rattaché à aucune structure.");
  }

  const tenantSlug = tenantTeam.name.replace('tenant_', '');

  return {
    userId: user.$id,
    email: user.email,
    tenantSlug,
  };
}