//packages/knowledge-ingestion/src/index.ts

/**
 * Cœur commun d'extraction de connaissances à partir d'un texte brut,
 * quelle que soit son origine (PDF importé manuellement, PDF trouvé par
 * la veille automatique, flux RSS, page web). Initialement écrit dans
 * extract-pdf-knowledge uniquement — extrait ici pour que
 * sync-official-sources puisse le réutiliser telle quelle plutôt que de
 * dupliquer encore une fois cette logique.
 */

export const MAX_CHUNK_CHARS = 12000; // ~3000 tokens par morceau, marge de sécurité pour l'appel Claude
export const MAX_CHUNKS_TO_PROCESS = 6; // filet de sécurité : un document de 100 pages ne doit pas générer 40 appels Claude d'affilée
export const MAX_ENTRIES_PER_CHUNK = 3;

export interface KnowledgeProposal {
  title: string;
  content: string;
}

/**
 * Découpe un texte en morceaux traitables par Claude un par un — un
 * document de plusieurs dizaines de pages dépasse largement ce qu'un seul
 * appel peut absorber. Coupe sur des sauts de paragraphe pour éviter de
 * trancher une phrase en plein milieu.
 */
export function chunkText(text: string, maxChars: number = MAX_CHUNK_CHARS): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length > maxChars && current.length > 0) {
      chunks.push(current);
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

/**
 * Contrainte de concision STRICTE dans le prompt — c'est elle qui protège
 * le coût récurrent en tokens à chaque question posée plus tard dans
 * ask-ai-lab, puisque chaque entrée générée ici sera relue à chaque appel
 * futur qui la sélectionne.
 */
export function buildExtractionPrompt(sourceLabel: string, chunk: string): string {
  return `Voici un extrait d'un document officiel${sourceLabel ? ` (${sourceLabel})` : ''} concernant l'économie ou le commerce en Afrique de l'Ouest.

Extrait :
"""
${chunk}
"""

Ta tâche : identifie UNIQUEMENT les faits durables, généraux et réutilisables (pas des chiffres ponctuels d'une seule année qui seront vite obsolètes, sauf s'ils illustrent une tendance structurelle importante). Reformule ces faits en langage clair et concis — ne recopie JAMAIS de phrase entière du texte source, synthétise toujours avec tes propres mots.

Règles strictes :
- Maximum ${MAX_ENTRIES_PER_CHUNK} entrées pour cet extrait.
- Chaque entrée : 100 à 150 mots MAXIMUM. C'est une contrainte dure, pas une suggestion.
- Si l'extrait ne contient rien d'utile ou de suffisamment général, retourne un tableau vide.
- Ne mentionne jamais le nom du document source dans le contenu généré — reformule comme une connaissance autonome.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après :
[
  { "title": "Titre court", "content": "Contenu reformulé, 100-150 mots" }
]`;
}

async function callClaude(prompt: string, anthropicApiKey: string): Promise<KnowledgeProposal[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1200,
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

  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Point d'entrée principal : découpe un texte brut et en extrait des
 * propositions de connaissances, tous chunks confondus (jusqu'à
 * MAX_CHUNKS_TO_PROCESS). Une erreur sur UN chunk n'interrompt pas les
 * autres — le résultat est simplement plus court que si tout avait
 * fonctionné.
 */
export async function extractKnowledgeFromText(
  text: string,
  sourceLabel: string,
  anthropicApiKey: string,
  onProgress?: (chunkIndex: number, totalChunks: number) => void
): Promise<KnowledgeProposal[]> {
  const chunks = chunkText(text).slice(0, MAX_CHUNKS_TO_PROCESS);
  const allProposals: KnowledgeProposal[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i, chunks.length);
    try {
      const prompt = buildExtractionPrompt(sourceLabel, chunks[i]);
      const proposals = await callClaude(prompt, anthropicApiKey);
      for (const p of proposals) {
        if (p.title && p.content) allProposals.push(p);
      }
    } catch {
      // Un chunk en échec ne doit pas faire perdre les propositions déjà obtenues sur les autres.
      continue;
    }
  }

  return allProposals;
}
