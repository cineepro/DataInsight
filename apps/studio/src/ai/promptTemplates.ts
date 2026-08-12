//apps/studio/src/ai/promptTemplates.ts
import type { AnalysisResult } from '@datainsight/shared';
import type { TenantCategory } from '@datainsight/shared';

interface PromptContext {
  tenantName: string;
  category: TenantCategory;
  period: string;
  results: AnalysisResult[];
}

interface DatasetPromptContext {
  tenantName: string;
  category: TenantCategory;
  datasetName: string;
  period: string;
  results: AnalysisResult[];
}

const ROLE_BY_CATEGORY: Record<TenantCategory, string> = {
  RESTAURANT: 'expert en business intelligence pour restaurants et fast-foods',
  FASTFOOD: 'expert en business intelligence pour restaurants et fast-foods',
  PHARMACIE: 'expert en business intelligence pour officines de pharmacie',
  ENTREPRISE: 'expert en business intelligence pour PME',
};

function formatResultsBlock(results: AnalysisResult[]): string {
  return results
    .map(
      (r) =>
        `### ${r.metricName} (statut: ${r.status})\nConstats: ${r.keyFindings.length > 0 ? r.keyFindings.join(' | ') : 'Aucun signal notable.'}`
    )
    .join('\n\n');
}

export function buildAnalysisPrompt(context: PromptContext): string {
  const { tenantName, category, period, results } = context;
  const role = ROLE_BY_CATEGORY[category];

  return `Tu es un ${role}.

Structure analysée : ${tenantName}
Période : ${period}

Voici les résultats mathématiques issus de notre moteur d'analyse interne :

${formatResultsBlock(results)}

Consignes :
1. Identifie la ou les causes principales des points signalés en WARNING ou CRITICAL.
2. Rédige entre 3 et 5 directives concrètes, immédiatement applicables par le gérant cette semaine.
3. Reste factuel : appuie-toi uniquement sur les constats fournis, n'invente aucun chiffre.
4. Si tout est OPTIMAL, félicite brièvement et propose 1 à 2 pistes d'amélioration mineures.
5. Réponds uniquement avec le texte des directives, sans préambule ni conclusion générique.`;
}

/**
 * Variante pour les datasets importés (fichiers Excel/CSV transmis par le
 * client) plutôt que les scans QR Code. Le vocabulaire s'adapte : on parle
 * de "données transmises" plutôt que de "clients", et la période est libre
 * (ex: "Janvier 2026") plutôt qu'une semaine ISO.
 */
export function buildDatasetAnalysisPrompt(context: DatasetPromptContext): string {
  const { tenantName, category, datasetName, period, results } = context;
  const role = ROLE_BY_CATEGORY[category];

  return `Tu es un ${role}, spécialisé dans l'analyse de données brutes transmises par un client.

Structure analysée : ${tenantName}
Jeu de données : ${datasetName}
Période : ${period}

Voici les résultats mathématiques issus de notre moteur d'analyse sur ces données :

${formatResultsBlock(results)}

Consignes :
1. Identifie les tendances et points d'attention principaux à partir de ces résultats.
2. Rédige entre 3 et 5 directives concrètes et actionnables pour le gérant.
3. Reste strictement factuel : appuie-toi uniquement sur les constats fournis, n'invente aucun chiffre ni contexte que tu ne connais pas.
4. Si les résultats sont majoritairement OPTIMAL, souligne les points positifs et propose des pistes d'amélioration mineures.
5. Réponds uniquement avec le texte des directives, sans préambule ni conclusion générique.`;
}