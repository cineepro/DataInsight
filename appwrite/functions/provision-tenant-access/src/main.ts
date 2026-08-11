//appwrite/functions/provision-tenant-access/src/main.ts
import { Client, Databases, Users, Teams, Query, ID } from 'node-appwrite';
import { generateTempPassword } from './generatePassword';

interface RequestPayload {
  tenantDocId: string;
}

interface ProvisionResult {
  success: boolean;
  email?: string;
  tempPassword?: string;
  alreadyProvisioned?: boolean;
  error?: string;
}

/**
 * Crée (ou réutilise) un compte gérant + une Team dédiée à ce tenant, et
 * relie les deux. Action déclenchée manuellement depuis le Studio via le
 * bouton "Provisionner l'accès client" — rien d'automatique.
 * NOTE : la signature exacte de teams.createMembership() peut varier selon
 * la version de node-appwrite installée — vérifie contre la doc si le build
 * échoue sur cet appel précis.
 */
export default async ({ req, res, log, error }: any) => {
  let body: RequestPayload;

  try {
    body = JSON.parse(req.bodyText || '{}');
  } catch {
    return res.json({ error: 'Corps de requête invalide.' }, 400);
  }

  if (!body.tenantDocId) {
    return res.json({ error: 'tenantDocId manquant.' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);
  const users = new Users(client);
  const teams = new Teams(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;
  const tenantsCollectionId = process.env.APPWRITE_COLLECTION_TENANTS!;

  try {
    const tenant = (await databases.getDocument(databaseId, tenantsCollectionId, body.tenantDocId)) as any;

    if (!tenant.contact_email) {
      return res.json({ error: "Ce tenant n'a pas d'email de contact renseigné." }, 400);
    }

    // --- Cas déjà provisionné : on ne recrée rien, on informe juste ---
    if (tenant.client_team_id) {
      const result: ProvisionResult = { success: true, alreadyProvisioned: true, email: tenant.contact_email };
      return res.json(result, 200);
    }

    // --- 1. Créer ou récupérer l'utilisateur ---
    let userId: string;
    let tempPassword: string | undefined;

    const existingUsers = await users.list([Query.equal('email', tenant.contact_email)]);

    if (existingUsers.users.length > 0) {
      userId = existingUsers.users[0].$id;
      log(`Utilisateur existant réutilisé pour ${tenant.contact_email}`);
    } else {
      tempPassword = generateTempPassword();
      const newUser = await users.create(ID.unique(), tenant.contact_email, undefined, tempPassword, tenant.name);
      userId = newUser.$id;
    }

    // --- 2. Créer la Team dédiée à ce tenant ---
    const team = await teams.create(ID.unique(), `tenant_${tenant.slug}`);

    // --- 3. Ajouter l'utilisateur comme membre (sans email d'invitation à confirmer) ---
    await teams.createMembership(team.$id, ['member'], undefined, tenant.contact_email, userId);

    // --- 4. Enregistrer l'ID de la Team sur le tenant ---
    await databases.updateDocument(databaseId, tenantsCollectionId, body.tenantDocId, {
      client_team_id: team.$id,
    });

    const result: ProvisionResult = {
      success: true,
      email: tenant.contact_email,
      tempPassword, // undefined si l'utilisateur existait déjà
      alreadyProvisioned: false,
    };

    return res.json(result, 200);
  } catch (err) {
    error('Erreur provision-tenant-access: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};