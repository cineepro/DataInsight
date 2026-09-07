//appwrite/functions/ask-ai-lab/src/main.ts
import { Client, Databases, Query, ID, Users } from 'node-appwrite';
import { hashVisitorToken } from './hashVisitor';
import { computeSectorBenchmark, fetchSectorFindings, fetchKnowledgeBase, fetchKnowledgeBaseBySource, getActiveOfficialSource, type AstraContextEnv } from '@datainsight/astra-context';

interface RequestPayload {
  question: string;
  sector: string;
  visitor_token: string;
  conversation_id?: string; // fourni par le front si une conversation Premium est déjà en cours
  official_source_id?: string; // connecteur Premium — restreint la réponse à cette seule source
}

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const FREE_DAILY_LIMIT = 5;
const MIN_TENANTS_FOR_BENCHMARK = 3;

function astraContextEnv(): AstraContextEnv {
  return {
    scansRestaurantCollectionId: process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!,
    scansPharmacieCollectionId: process.env.APPWRITE_COLLECTION_SCANS_PHARMACIE!,
    scansEntrepriseCollectionId: process.env.APPWRITE_COLLECTION_SCANS_ENTREPRISE!,
    weeklyReportsCollectionId: process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!,
    datasetReportsCollectionId: process.env.APPWRITE_COLLECTION_DATASET_REPORTS!,
    knowledgeBaseCollectionId: process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!,
    officialSourcesCollectionId: process.env.APPWRITE_COLLECTION_OFFICIAL_SOURCES!,
  };
}

interface AiLabAccount {
  $id: string;
  user_id: string;
  plan: 'FREE' | 'PREMIUM';
  daily_question_limit: number;
}

/**
 * Retrouve le compte ai_lab_accounts de l'utilisateur authentifié, s'il y
 * en a un. Retourne null pour un visiteur anonyme — c'est ce qui permet à
 * toute la suite de la Function de continuer à fonctionner exactement
 * comme avant pour le mode gratuit sans compte.
 */
async function getAccountForUser(databases: any, databaseId: string, userId: string | null): Promise<AiLabAccount | null> {
  if (!userId) return null;

  const result = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_AI_LAB_ACCOUNTS!, [
    Query.equal('user_id', userId),
    Query.limit(1),
  ]);

  return (result.documents[0] as unknown as AiLabAccount) ?? null;
}

/**
 * Vérifie le quota selon le type d'appelant :
 * - Compte connecté (FREE ou PREMIUM) : quota compté par user_id, propre
 *   à ce compte, peu importe l'appareil utilisé.
 * - Visiteur anonyme : quota compté par visitor_hash, comme avant.
 */
async function checkAndRecordRateLimit(
  databases: any,
  databaseId: string,
  key: string,
  limit: number
): Promise<boolean> {
  const rateLimitCollectionId = process.env.APPWRITE_COLLECTION_AI_LAB_RATE_LIMIT!;
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const recent = await databases.listDocuments(databaseId, rateLimitCollectionId, [
    Query.equal('visitor_hash', key),
    Query.greaterThan('timestamp', windowStart),
    Query.limit(limit + 1),
  ]);

  if (recent.documents.length >= limit) return false;

  await databases.createDocument(databaseId, rateLimitCollectionId, ID.unique(), {
    visitor_hash: key,
    timestamp: new Date().toISOString(),
  });

  return true;
}

/**
 * Sauvegarde la question/réponse dans l'historique persistant, réservé
 * aux comptes Premium. Crée la conversation si conversation_id n'est pas
 * fourni (première question d'un nouvel échange).
 */
async function saveToHistory(
  databases: any,
  databaseId: string,
  userId: string,
  conversationId: string | undefined,
  question: string,
  answer: string
): Promise<string> {
  let convId = conversationId;

  if (!convId) {
    const created = await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_AI_LAB_CONVERSATIONS!, ID.unique(), {
      user_id: userId,
      title: question.slice(0, 80),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    convId = created.$id;
  } else {
    await databases.updateDocument(databaseId, process.env.APPWRITE_COLLECTION_AI_LAB_CONVERSATIONS!, convId, {
      updated_at: new Date().toISOString(),
    });
  }

  await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_AI_LAB_MESSAGES!, ID.unique(), {
    conversation_id: convId!,
    role: 'USER',
    content: question,
    created_at: new Date().toISOString(),
  });

  await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_AI_LAB_MESSAGES!, ID.unique(), {
    conversation_id: convId!,
    role: 'ASSISTANT',
    content: answer,
    created_at: new Date().toISOString(),
  });

  return convId!;
}

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.question || !body.sector || !body.visitor_token) {
      return res.json({ error: 'Champs requis manquants.' }, 400);
    }

    if (body.question.length > 500) {
      return res.json({ error: 'Question trop longue (500 caractères maximum).' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const visitorHash = hashVisitorToken(body.visitor_token);

    // --- Identifier l'appelant : connecté ou anonyme ---
    // execute: ["any"] laisse passer les deux cas ; ce header n'est présent
    // que si une session valide a accompagné l'appel.
    const callerUserId = req.headers?.['x-appwrite-user-id'] || null;
    const aiLabAccount = await getAccountForUser(databases, databaseId, callerUserId);

    log('Appelant: ' + (aiLabAccount ? `compte ${aiLabAccount.plan}` : 'anonyme'));

    // --- Quota selon le type de compte ---
    const rateLimitKey = aiLabAccount ? `account_${aiLabAccount.user_id}` : visitorHash;
    const rateLimitValue = aiLabAccount ? aiLabAccount.daily_question_limit : FREE_DAILY_LIMIT;

    const allowed = await checkAndRecordRateLimit(databases, databaseId, rateLimitKey, rateLimitValue);
    if (!allowed) {
      return res.json(
        { error: `Limite de ${rateLimitValue} questions par jour atteinte. ${aiLabAccount ? '' : 'Créez un compte pour un quota plus élevé, ou '}revenez demain !` },
        429
      );
    }

    // --- Connecteur de source (Premium uniquement) ---
    // Un compte gratuit qui enverrait quand même official_source_id est
    // silencieusement ramené au comportement normal par secteur — pas
    // d'erreur bruyante pour quelque chose que l'interface normale ne
    // permet de toute façon pas de déclencher.
    let connectedSource: { $id: string; name: string } | null = null;
    if (body.official_source_id && aiLabAccount?.plan === 'PREMIUM') {
      connectedSource = await getActiveOfficialSource(databases, databaseId, body.official_source_id, astraContextEnv());
      if (!connectedSource) {
        return res.json({ error: "Cette source n'est plus disponible pour le moment." }, 400);
      }
    }

    // --- Construction du contexte RAG ---
    log(
      connectedSource
        ? `Construction du contexte pour la source connectée "${connectedSource.name}"`
        : 'Construction du contexte pour secteur=' + body.sector
    );

    const [knowledgeContext, benchmark] = await Promise.all([
      connectedSource
        ? fetchKnowledgeBaseBySource(databases, databaseId, connectedSource.$id, astraContextEnv())
        : fetchKnowledgeBase(databases, databaseId, body.sector, astraContextEnv()),
      computeSectorBenchmark(databases, databaseId, body.sector, astraContextEnv()),
    ]);

    const findingsContext = !connectedSource && benchmark.distinctTenants.size >= MIN_TENANTS_FOR_BENCHMARK
      ? await fetchSectorFindings(databases, databaseId, benchmark.distinctTenants, astraContextEnv())
      : null;

    const prompt = connectedSource
      ? `Tu es Astra, l'assistant IA d'ASILLIA DataInsight. L'utilisateur a explicitement connecté la source "${connectedSource.name}" à sa question — tu dois répondre EXCLUSIVEMENT à partir des connaissances ci-dessous, issues de cette source.

${knowledgeContext ? `Connaissances disponibles pour cette source :\n${knowledgeContext}\n` : "Aucune connaissance n'est encore disponible pour cette source.\n"}

Question de l'utilisateur : ${body.question}

Consignes :
1. Réponds UNIQUEMENT à partir des connaissances ci-dessus — n'utilise aucune autre connaissance générale.
2. Si les connaissances disponibles ne permettent pas de répondre à la question, dis-le honnêtement plutôt que de répondre avec des informations générales.
3. Réponds de façon concise (maximum 150 mots), claire et actionnable.`
      : `Tu es Astra, l'assistant IA d'ASILLIA DataInsight, spécialisé dans le commerce en Afrique de l'Ouest (restaurants, pharmacies, hôtels, commerces). Si on te demande qui tu es, présente-toi par ton nom.

${knowledgeContext ? `Voici des connaissances de référence sur ce secteur :\n${knowledgeContext}\n` : ''}
${benchmark.text ? `Voici des données réelles agrégées et anonymisées :\n${benchmark.text}\n` : ''}
${findingsContext ? `${findingsContext}\n` : ''}

Question du visiteur : ${body.question}

Consignes :
1. Réponds de façon concise (maximum 150 mots), claire et actionnable.
2. Si tu t'appuies sur les données ou constats ci-dessus, mentionne-le explicitement, mais reste toujours au niveau du secteur dans son ensemble.
3. Si tu n'as pas assez d'information pour répondre précisément, dis-le honnêtement plutôt que d'inventer.
4. Ne mentionne JAMAIS de structure ou d'entreprise nommée, ni aucun détail qui permettrait d'identifier une structure précise.
5. Termine en rappelant brièvement qu'ASILLIA DataInsight peut approfondir cette analyse pour une structure spécifique.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      error('Erreur API Claude: ' + errorText);
      return res.json({ error: "Erreur lors de la génération de la réponse." }, 502);
    }

    const claudeData = (await claudeResponse.json()) as any;
    const answer = claudeData.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    // --- Journalisation : toujours dans ai_chat_logs (pour ton usage
    // interne, summarize-chat-logs) + en plus dans l'historique persistant
    // SI le compte est Premium ---
    await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_AI_CHAT_LOGS!, ID.unique(), {
      visitor_hash: visitorHash,
      sector: body.sector,
      question: body.question,
      answer,
      created_at: new Date().toISOString(),
    });

    let conversationId: string | undefined;
    if (aiLabAccount?.plan === 'PREMIUM' && callerUserId) {
      conversationId = await saveToHistory(databases, databaseId, callerUserId, body.conversation_id, body.question, answer);
    }

    return res.json({ answer, conversation_id: conversationId }, 200);
  } catch (err) {
    error('Erreur ask-ai-lab: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};