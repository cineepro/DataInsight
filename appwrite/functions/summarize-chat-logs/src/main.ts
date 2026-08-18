//appwrite/functions/summarize-chat-logs/src/main.ts
import { Client, Databases, Query, ID } from 'node-appwrite';

const SECTORS = ['GENERAL', 'RESTAURATION', 'HOTELLERIE', 'PHARMACIE', 'COMMERCE_DETAIL'];
const LOOKBACK_DAYS = 7;
const MIN_QUESTIONS_TO_ANALYZE = 3; // pas la peine de solliciter Claude si trop peu de matière

interface ChatLog {
  sector: string;
  question: string;
  answer: string;
}

interface ProposedEntry {
  title: string;
  content: string;
  source_question_count: number;
}

async function fetchRecentLogsForSector(
  databases: any,
  databaseId: string,
  sector: string,
  since: string
): Promise<ChatLog[]> {
  const result = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_AI_CHAT_LOGS!, [
    Query.equal('sector', sector),
    Query.greaterThan('created_at', since),
    Query.limit(200),
  ]);
  return result.documents as ChatLog[];
}

/**
 * Le prompt est structuré pour forcer Claude à rester strictement ancré
 * sur les questions réelles fournies — jamais de connaissance générale
 * inventée, jamais de sujet hors de ce qui a été effectivement demandé.
 * Format JSON strict en sortie pour un parsing fiable, sans dépendre
 * d'une mise en forme texte fragile.
 */
function buildAnalysisPrompt(sector: string, logs: ChatLog[]): string {
  const transcript = logs
    .map((log, i) => `[Q${i + 1}] Question: ${log.question}\nRéponse donnée: ${log.answer}`)
    .join('\n\n');

  return `Tu es chargé d'améliorer la base de connaissances d'un assistant IA spécialisé dans le commerce en Afrique de l'Ouest, secteur : ${sector}.

Voici les questions posées par des visiteurs au cours des ${LOOKBACK_DAYS} derniers jours, avec les réponses déjà données par l'assistant :

${transcript}

Ta tâche :
1. Identifie UNIQUEMENT les thèmes qui reviennent dans PLUSIEURS questions ci-dessus (au moins 2 questions similaires), ou les cas où la réponse donnée semble vague, générique, ou incomplète par rapport à ce qui était demandé.
2. Pour chaque thème identifié, rédige une entrée de base de connaissances factuelle et précise sur ce sujet — un contenu de référence que l'assistant pourra citer la prochaine fois qu'une question similaire arrive.

Règles strictes à respecter absolument :
- Ne t'appuie QUE sur les questions listées ci-dessus. N'invente aucun thème qui n'a pas été réellement demandé.
- Ne fabrique aucune statistique, aucun chiffre précis que tu ne connais pas avec certitude — reste sur des principes et bonnes pratiques générales, pas des données chiffrées.
- Si aucun thème ne se répète et qu'aucune réponse ne semble insuffisante, retourne un tableau vide.
- Maximum 3 propositions, même si plus de thèmes existent — priorise les plus fréquents.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après, au format exact suivant :
[
  {
    "title": "Titre court et descriptif",
    "content": "Contenu de 100 à 200 mots, factuel et actionnable",
    "source_question_count": 2
  }
]`;
}

async function callClaude(prompt: string): Promise<ProposedEntry[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API Claude: ${await response.text()}`);
  }

  const data = (await response.json()) as any;
  const text = data.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');

  // Filet de sécurité : Claude respecte généralement la consigne "JSON
  // uniquement", mais on nettoie d'éventuels ```json ... ``` résiduels
  // avant de parser, au cas où.
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // une réponse mal formée ne doit jamais faire planter tout le run hebdomadaire
  }
}

export default async ({ req, res, log, error }: any) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    let totalProposed = 0;

    for (const sector of SECTORS) {
      log(`Analyse du secteur ${sector}...`);
      const logs = await fetchRecentLogsForSector(databases, databaseId, sector, since);

      if (logs.length < MIN_QUESTIONS_TO_ANALYZE) {
        log(`${sector} : seulement ${logs.length} question(s), ignoré (seuil = ${MIN_QUESTIONS_TO_ANALYZE}).`);
        continue;
      }

      const prompt = buildAnalysisPrompt(sector, logs);
      const proposals = await callClaude(prompt);

      log(`${sector} : ${proposals.length} proposition(s) générée(s).`);

      for (const proposal of proposals) {
        if (!proposal.title || !proposal.content) continue;

        await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!, ID.unique(), {
          title: proposal.title,
          sector,
          content: proposal.content,
          status: 'DRAFT', // jamais publié automatiquement — validation humaine obligatoire
          source_question_count: proposal.source_question_count ?? logs.length,
          created_at: new Date().toISOString(),
        });
        totalProposed++;
      }
    }

    log(`Terminé. ${totalProposed} proposition(s) créée(s) en brouillon au total.`);
    return res.json({ success: true, proposed: totalProposed }, 200);
  } catch (err) {
    error('Erreur summarize-chat-logs: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};