//apps/studio/src/ai/promptTemplates.ts
import type { AnalysisResult } from '@datainsight/shared';
import type { TenantCategory } from '@datainsight/shared';

interface PromptContext {
  tenantName: string;
  category: TenantCategory;
  period: string;
  results: AnalysisResult[];
}

const ROLE_BY_CATEGORY: Record<TenantCategory, string> = {
  RESTAURANT: 'expert en business intelligence pour restaurants et fast-foods',
  FASTFOOD: 'expert en business intelligence pour restaurants et fast-foods',
  PHARMACIE: 'expert en business intelligence pour officines de pharmacie',
  ENTREPRISE: 'expert en business intelligence pour PME',
};

/**
 * Construit le prompt envoyé à Claude à partir des résultats bruts du
 * moteur d'analyse (engine/). Claude ne refait AUCUN calcul : il reçoit
 * les faits déjà calculés et se concentre sur la rédaction des directives.
 */
export function buildAnalysisPrompt(context: PromptContext): string {
  const { tenantName, category, period, results } = context;
  const role = ROLE_BY_CATEGORY[category];

  const resultsBlock = results
    .map(
      (r) =>
        `### ${r.metricName} (statut: ${r.status})\nConstats: ${r.keyFindings.length > 0 ? r.keyFindings.join(' | ') : 'Aucun signal notable.'}`
    )
    .join('\n\n');

  return `Tu es un ${role}.

Structure analysée : ${tenantName}
Période : ${period}

Voici les résultats mathématiques issus de notre moteur d'analyse interne :

${resultsBlock}

Consignes :
1. Identifie la ou les causes principales des points signalés en WARNING ou CRITICAL.
2. Rédige entre 3 et 5 directives concrètes, immédiatement applicables par le gérant cette semaine.
3. Reste factuel : appuie-toi uniquement sur les constats fournis, n'invente aucun chiffre.
4. Si tout est OPTIMAL, félicite brièvement et propose 1 à 2 pistes d'amélioration mineures.
5. Réponds uniquement avec le texte des directives, sans préambule ni conclusion générique.`;
}