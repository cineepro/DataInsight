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

  log('Étape 0 — payload reçu : ' + JSON.stringify(body));

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  log('Étape 1 — client initialisé, clé présente : ' + !!process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const users = new Users(client);
  const teams = new Teams(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;
  const tenantsCollectionId = process.env.APPWRITE_COLLECTION_TENANTS!;

  try {
    log('Étape 2 — avant lecture du tenant, databaseId=' + databaseId + ' collectionId=' + tenantsCollectionId);
    const tenant = (await databases.getDocument(databaseId, tenantsCollectionId, body.tenantDocId)) as any;
    log('Étape 3 — tenant récupéré : ' + tenant.name);

    if (!tenant.contact_email) {
      return res.json({ error: "Ce tenant n'a pas d'email de contact renseigné." }, 400);
    }

    if (tenant.client_team_id) {
      log('Étape 4 — déjà provisionné');
      const result: ProvisionResult = { success: true, alreadyProvisioned: true, email: tenant.contact_email };
      return res.json(result, 200);
    }

    let userId: string;
    let tempPassword: string | undefined;

    log('Étape 5 — recherche utilisateur existant pour ' + tenant.contact_email);
    const existingUsers = await users.list([Query.equal('email', tenant.contact_email)]);
    log('Étape 6 — recherche terminée, trouvés : ' + existingUsers.users.length);

    if (existingUsers.users.length > 0) {
      userId = existingUsers.users[0].$id;
    } else {
      tempPassword = generateTempPassword();
      log('Étape 7 — création utilisateur');
      const newUser = await users.create(ID.unique(), tenant.contact_email, undefined, tempPassword, tenant.name);
      userId = newUser.$id;
      log('Étape 8 — utilisateur créé : ' + userId);
    }

    log('Étape 9 — création de la Team');
    const team = await teams.create(ID.unique(), `tenant_${tenant.slug}`);
    log('Étape 10 — Team créée : ' + team.$id);

    log('Étape 11 — ajout du membre à la Team');
    await teams.createMembership(team.$id, ['member'], undefined, tenant.contact_email, userId);
    log('Étape 12 — membre ajouté');

    await databases.updateDocument(databaseId, tenantsCollectionId, body.tenantDocId, {
      client_team_id: team.$id,
    });
    log('Étape 13 — tenant mis à jour, terminé');

    const result: ProvisionResult = {
      success: true,
      email: tenant.contact_email,
      tempPassword,
      alreadyProvisioned: false,
    };

    return res.json(result, 200);
  } catch (err) {
    error('Erreur provision-tenant-access: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};