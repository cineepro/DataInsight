import PageShell from '../../../components/PageShell';
import DevNav from '../components/DevNav';
import CodeBlock from '../components/CodeBlock';
import { mailtoLink } from '../../../config/contact';

export default function DevelopersPage() {
  return (
    <PageShell>
      <section className="px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Documentation développeurs</span>
            <h1 className="mt-2 font-display text-4xl font-medium text-ink">API ASILLIA DataInsight</h1>
            <p className="mx-auto mt-4 max-w-xl text-neutral-600">
              Intégrez Astra ou notre moteur d'analyse directement dans vos propres outils, applications ou pipelines de données.
            </p>
          </div>

          <div className="flex gap-10">
            <DevNav />

            <div className="flex-1 flex flex-col gap-16">
              {/* ---------------- VUE D'ENSEMBLE ---------------- */}
              <div id="intro" className="scroll-mt-24">
                <h2 className="mb-4 font-display text-2xl font-medium text-ink">Vue d'ensemble</h2>
                <p className="mb-4 text-sm leading-relaxed text-neutral-600">
                  ASILLIA DataInsight propose deux API distinctes, chacune accessible avec sa propre clé :
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-neutral-200 bg-white p-5">
                    <h3 className="font-medium text-ink">Astra API</h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      Interrogez notre assistant IA spécialisé dans le commerce en Afrique de l'Ouest, directement depuis votre application.
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-5">
                    <h3 className="font-medium text-ink">Analysis Engine API</h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      Envoyez vos propres données (restaurant, pharmacie, entreprise) et recevez un résultat d'analyse structuré.
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-neutral-600">
                  Les deux fonctionnent selon le même principe : une requête HTTP <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">POST</code> vers un endpoint dédié, authentifiée par une clé API transmise dans un en-tête. Selon votre besoin, nous pouvons vous fournir soit deux clés distinctes (une par produit), soit une seule clé donnant accès aux deux — précisez-le lors de votre demande.
                </p>
              </div>

              {/* ---------------- OBTENIR UNE CLÉ ---------------- */}
              <div id="obtenir-cle" className="scroll-mt-24">
                <h2 className="mb-4 font-display text-2xl font-medium text-ink">Obtenir une clé API</h2>
                <p className="mb-4 text-sm leading-relaxed text-neutral-600">
                  Les clés API ne sont pas générées en libre-service pour le moment — chaque clé est créée manuellement par notre équipe, après un échange rapide pour comprendre votre besoin et choisir le palier adapté.
                </p>
                <ol className="mb-6 flex flex-col gap-3 text-sm text-neutral-700">
                  <li className="flex gap-3">
                    <span className="font-mono text-violet-500">1.</span>
                    Contactez-nous en précisant le produit souhaité (Astra API, Analysis Engine API, ou les deux) et votre usage prévu.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-violet-500">2.</span>
                    Nous vous générons une clé au format <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">di_live_...</code>, valable immédiatement.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-violet-500">3.</span>
                    <strong>Important :</strong> la clé complète ne vous est montrée qu'une seule fois. Conservez-la immédiatement dans un endroit sûr (gestionnaire de secrets, variable d'environnement) — nous ne pouvons pas vous la renvoyer si vous la perdez, seule une nouvelle clé peut être générée.
                  </li>
                </ol>
                <a
                  href={mailtoLink('Demande de clé API — ASILLIA DataInsight')}
                  className="inline-block rounded-full bg-violet-gradient px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Demander une clé API
                </a>
              </div>

              {/* ---------------- ASTRA API ---------------- */}
              <div id="astra-api" className="scroll-mt-24">
                <h2 className="mb-2 font-display text-2xl font-medium text-ink">Astra API</h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-600">
                  Un seul endpoint, une seule requête : envoyez une question et un secteur, recevez une réponse contextualisée.
                </p>

                <h3 className="mb-2 text-sm font-semibold text-ink">Endpoint</h3>
                <CodeBlock
                  code={`POST https://cloud.appwrite.io/v1/functions/api-ask-astra/executions`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">En-têtes requis</h3>
                <CodeBlock
                  language="http"
                  code={`Content-Type: application/json
x-api-key: di_live_votre_cle_ici`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Corps de la requête</h3>
                <CodeBlock
                  language="json"
                  code={`{
  "question": "Comment anticiper les ruptures de stock en pharmacie ?",
  "sector": "PHARMACIE"
}`}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5">sector</code> accepte : <code className="rounded bg-neutral-100 px-1.5 py-0.5">GENERAL</code>, <code className="rounded bg-neutral-100 px-1.5 py-0.5">RESTAURATION</code>, <code className="rounded bg-neutral-100 px-1.5 py-0.5">HOTELLERIE</code>, <code className="rounded bg-neutral-100 px-1.5 py-0.5">PHARMACIE</code>, <code className="rounded bg-neutral-100 px-1.5 py-0.5">COMMERCE_DETAIL</code>.
                </p>

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Réponse (200)</h3>
                <CodeBlock
                  language="json"
                  code={`{
  "answer": "Pour anticiper les ruptures de stock, il est recommandé de..."
}`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Exemple complet (cURL)</h3>
                <CodeBlock
                  code={`curl -X POST \\
  https://cloud.appwrite.io/v1/functions/api-ask-astra/executions \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: di_live_votre_cle_ici" \\
  -d '{
    "question": "Quelles sont les tendances de fréquentation en restauration ?",
    "sector": "RESTAURATION"
  }'`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Exemple (JavaScript / Node.js)</h3>
                <CodeBlock
                  language="javascript"
                  code={`const response = await fetch(
  "https://cloud.appwrite.io/v1/functions/api-ask-astra/executions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ASILLIA_API_KEY,
    },
    body: JSON.stringify({
      question: "Comment mesurer l'impact d'une promotion ?",
      sector: "COMMERCE_DETAIL",
    }),
  }
);

const data = await response.json();
console.log(data.answer);`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Exemple (Python)</h3>
                <CodeBlock
                  language="python"
                  code={`import requests
import os

response = requests.post(
    "https://cloud.appwrite.io/v1/functions/api-ask-astra/executions",
    headers={
        "Content-Type": "application/json",
        "x-api-key": os.environ["ASILLIA_API_KEY"],
    },
    json={
        "question": "Quels indicateurs suivre pour un hôtel ?",
        "sector": "HOTELLERIE",
    },
)

print(response.json()["answer"])`}
                />
              </div>

              {/* ---------------- ANALYSIS ENGINE API ---------------- */}
              <div id="analysis-api" className="scroll-mt-24">
                <h2 className="mb-2 font-display text-2xl font-medium text-ink">Analysis Engine API</h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-600">
                  Envoyez vos propres données (jamais les nôtres) et recevez un résultat d'analyse structuré, calculé par les mêmes fonctions que celles utilisées en interne par ASILLIA DataInsight.
                </p>

                <h3 className="mb-2 text-sm font-semibold text-ink">Endpoint</h3>
                <CodeBlock code={`POST https://cloud.appwrite.io/v1/functions/api-run-analysis/executions`} />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Corps de la requête</h3>
                <CodeBlock
                  language="json"
                  code={`{
  "category": "RESTAURANT",
  "function_id": "restaurant.peak_hours_bottlenecks",
  "data": [
    {
      "timestamp": "2026-08-20T13:15:00Z",
      "wait_time_bucket": "GT30",
      "satisfaction_global": 2
    },
    {
      "timestamp": "2026-08-20T13:20:00Z",
      "wait_time_bucket": "15_30",
      "satisfaction_global": 3
    }
  ],
  "thresholds": {
    "dissatisfaction_threshold": 0.3,
    "min_sample_size": 3
  }
}`}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5">thresholds</code> est optionnel — nos valeurs par défaut s'appliquent si vous ne les précisez pas.
                </p>

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Le champ context (optionnel)</h3>
                <p className="mb-3 text-sm leading-relaxed text-neutral-600">
                  Certaines fonctions ont besoin d'informations supplémentaires pour produire un résultat pertinent — en particulier <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">restaurant.compare_periods</code>, qui compare votre période actuelle à une période antérieure.
                </p>
                <CodeBlock
                  language="json"
                  code={`{
  "category": "RESTAURANT",
  "function_id": "restaurant.compare_periods",
  "data": [ /* vos scans de la période actuelle */ ],
  "context": {
    "year": 2026,
    "weekNumber": 34,
    "previousPeriodData": [ /* vos scans de la période précédente, même format que data */ ]
  }
}`}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5">year</code> et <code className="rounded bg-neutral-100 px-1.5 py-0.5">weekNumber</code> servent uniquement à étiqueter la période dans la réponse (ex: "Semaine 34 — 2026") — omis, la fonction utilise la semaine en cours. <code className="rounded bg-neutral-100 px-1.5 py-0.5">previousPeriodData</code> n'est nécessaire que pour les fonctions de comparaison.
                </p>

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Fonctions disponibles</h3>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Catégorie</th>
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">function_id</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['RESTAURANT / FASTFOOD', 'restaurant.peak_hours_bottlenecks'],
                        ['RESTAURANT / FASTFOOD', 'restaurant.menu_satisfaction_matrix'],
                        ['RESTAURANT / FASTFOOD', 'restaurant.compare_periods'],
                        ['PHARMACIE', 'pharmacie.queue_staffing_efficiency'],
                        ['PHARMACIE', 'pharmacie.stockout_impact'],
                        ['PHARMACIE', 'pharmacie.service_segmentation'],
                        ['ENTREPRISE', 'entreprise.generic_trends'],
                      ].map(([cat, id]) => (
                        <tr key={id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-2 text-neutral-600">{cat}</td>
                          <td className="px-4 py-2 font-mono text-xs text-ink">{id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Réponse (200)</h3>
                <CodeBlock
                  language="json"
                  code={`{
  "result": {
    "metricName": "Pics d'affluence et goulets d'étranglement",
    "period": "Semaine 1 — 2026",
    "status": "WARNING",
    "dataPoints": { "slots": [...], "criticalSlots": [...] },
    "keyFindings": [
      "Pic critique à 13h : 45% d'insatisfaction sur 8 avis"
    ]
  }
}`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Exemple (Node.js)</h3>
                <CodeBlock
                  language="javascript"
                  code={`const response = await fetch(
  "https://cloud.appwrite.io/v1/functions/api-run-analysis/executions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ASILLIA_API_KEY,
    },
    body: JSON.stringify({
      category: "PHARMACIE",
      function_id: "pharmacie.stockout_impact",
      data: monPropreJeuDeDonnees,
    }),
  }
);

const { result } = await response.json();
console.log(result.keyFindings);`}
                />
              </div>

              {/* ---------------- DATA JOIN & ANALYSIS API ---------------- */}
              <div id="join-api" className="scroll-mt-24">
                <h2 className="mb-2 font-display text-2xl font-medium text-ink">Data Join &amp; Analysis API</h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-600">
                  Vous avez plusieurs fichiers de données liés entre eux (par exemple des clients et leurs commandes) ? Cette API les fusionne selon les clés que vous indiquez, et peut — en option, dans le même appel — lancer une ou plusieurs analyses sur le résultat fusionné. Fait partie de l'<strong>Analysis Engine API</strong> — même clé, même quota.
                </p>

                <h3 className="mb-2 text-sm font-semibold text-ink">Endpoint</h3>
                <CodeBlock code={`POST https://cloud.appwrite.io/v1/functions/api-join-datasets/executions`} />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">En-têtes requis</h3>
                <CodeBlock
                  language="http"
                  code={`Content-Type: application/json
x-api-key: di_live_votre_cle_ici`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Corps de la requête — jointure seule</h3>
                <p className="mb-3 text-sm leading-relaxed text-neutral-600">
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">datasets</code> est la liste de vos fichiers (2 à 6), chacun avec un <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">label</code> et ses <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">rows</code> (vos lignes, en objets JSON simples). <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">steps</code> décrit comment chaque dataset (à partir de l'index 1) se rattache au résultat déjà accumulé — utile quand la colonne de jointure change d'une étape à l'autre.
                </p>
                <CodeBlock
                  language="json"
                  code={`{
  "datasets": [
    { "label": "clients", "rows": [
      { "id_client": "C001", "ville": "Cotonou" },
      { "id_client": "C002", "ville": "Calavi" }
    ]},
    { "label": "commandes", "rows": [
      { "id_client": "C001", "montant": 15000, "categorie": "Alimentation" },
      { "id_client": "C001", "montant": 8000, "categorie": "Boisson" },
      { "id_client": "C002", "montant": 22000, "categorie": "Alimentation" }
    ]}
  ],
  "steps": [
    { "datasetIndex": 1, "keyColumn": "id_client", "previousKeyColumn": "id_client", "joinType": "INNER" }
  ]
}`}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5">joinType</code> : <code className="rounded bg-neutral-100 px-1.5 py-0.5">INNER</code> (uniquement les correspondances, par défaut) ou <code className="rounded bg-neutral-100 px-1.5 py-0.5">LEFT</code> (toutes les lignes du premier dataset, même sans correspondance).
                </p>

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Ajouter des analyses (optionnel)</h3>
                <p className="mb-3 text-sm leading-relaxed text-neutral-600">
                  Ajoutez un champ <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">analyses</code> pour que le résultat fusionné soit directement analysé, sans second appel. Les colonnes se référencent par leur <strong>nom final</strong> — celui que vous voyez dans <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">result.columns</code> de la réponse, pas une clé interne.
                </p>
                <CodeBlock
                  language="json"
                  code={`{
  "datasets": [ /* comme ci-dessus */ ],
  "steps": [ /* comme ci-dessus */ ],
  "analyses": [
    {
      "type": "pivot_table",
      "rowColumns": ["ville"],
      "pivotColumn": "categorie",
      "metricColumn": "montant",
      "aggregation": "SUM"
    }
  ]
}`}
                />

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Les 7 types d'analyse disponibles</h3>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">type</th>
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Champs</th>
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Ce que ça calcule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['aggregate_by_dimension', 'dimensionColumn, metricColumn?, aggregation?', "Somme/moyenne/compte groupée par une dimension"],
                        ['aggregate_by_dimensions', 'dimensionColumns[] (2 min), metricColumn?, aggregation?', 'Idem, en croisant 2 dimensions ou plus'],
                        ['top_n_by_dimension', 'dimensionColumn, metricColumn?, n?', 'Classement décroissant, limité aux n premiers'],
                        ['cross_correlate_columns', 'columnA, columnB', 'Corrélation entre deux mesures numériques'],
                        ['detect_anomalies', 'metricColumn, identifierColumn?', 'Valeurs statistiquement aberrantes'],
                        ['analyze_trend_by_period', 'periodColumn, groupColumn?, metricColumn?, aggregation?', 'Évolution période par période + détection du point de rupture'],
                        ['pivot_table', 'rowColumns[], pivotColumn?, metricColumn?, aggregation?', 'Tableau croisé lignes × colonnes'],
                      ].map(([type, fields, desc]) => (
                        <tr key={type} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-2 font-mono text-xs text-ink">{type}</td>
                          <td className="px-4 py-2 font-mono text-xs text-neutral-600">{fields}</td>
                          <td className="px-4 py-2 text-neutral-500">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5">aggregation</code> accepte <code className="rounded bg-neutral-100 px-1.5 py-0.5">SUM</code>, <code className="rounded bg-neutral-100 px-1.5 py-0.5">AVERAGE</code> ou <code className="rounded bg-neutral-100 px-1.5 py-0.5">COUNT</code> (par défaut SUM, sauf pour l'évolution temporelle où c'est AVERAGE). Vous pouvez combiner jusqu'à 10 analyses dans le même appel.
                </p>

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Réponse (200)</h3>
                <CodeBlock
                  language="json"
                  code={`{
  "result": {
    "rows": [ { "id_client": "C001", "ville": "Cotonou", "montant": 15000, "categorie": "Alimentation" }, ... ],
    "columns": ["id_client", "ville", "montant", "categorie"],
    "rowCount": 3,
    "unmatchedBaseCount": 0,
    "unmatchedAdditionCount": 0,
    "analyses": [
      {
        "metricName": "montant — ville × categorie",
        "status": "OPTIMAL",
        "dataPoints": { "rowLabels": [...], "columnLabels": [...], "matrix": [...], "rowTotals": [...], "columnTotals": [...], "grandTotal": 45000 },
        "keyFindings": ["Cotonou : 23000 au total", "Calavi : 22000 au total"]
      }
    ]
  }
}`}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Le champ <code className="rounded bg-neutral-100 px-1.5 py-0.5">analyses</code> n'apparaît dans la réponse que si vous en avez demandé dans la requête.
                </p>

                <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Exemple complet (Node.js)</h3>
                <CodeBlock
                  language="javascript"
                  code={`const response = await fetch(
  "https://cloud.appwrite.io/v1/functions/api-join-datasets/executions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ASILLIA_API_KEY,
    },
    body: JSON.stringify({
      datasets: [
        { label: "clients", rows: mesClients },
        { label: "commandes", rows: mesCommandes },
      ],
      steps: [
        { datasetIndex: 1, keyColumn: "id_client", previousKeyColumn: "id_client", joinType: "INNER" },
      ],
      analyses: [
        { type: "pivot_table", rowColumns: ["ville"], pivotColumn: "categorie", metricColumn: "montant", aggregation: "SUM" },
      ],
    }),
  }
);

const { result } = await response.json();
console.log(result.analyses[0].dataPoints.matrix);`}
                />
              </div>

              {/* ---------------- CODES D'ERREUR ---------------- */}
              <div id="erreurs" className="scroll-mt-24">
                <h2 className="mb-4 font-display text-2xl font-medium text-ink">Codes d'erreur</h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Code</th>
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Signification</th>
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Que faire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['400', 'Requête mal formée', 'Vérifiez le format JSON et les champs requis.'],
                        ['401', 'Clé API manquante ou invalide', "Vérifiez l'en-tête x-api-key."],
                        ['403', 'Clé suspendue, révoquée, ou sans accès à ce produit', 'Contactez-nous pour vérifier le statut de votre clé.'],
                        ['429', 'Quota mensuel atteint', 'Attendez le renouvellement (1er du mois) ou demandez un palier supérieur.'],
                        ['500 / 502', 'Erreur côté serveur ASILLIA', 'Réessayez ; contactez-nous si le problème persiste.'],
                      ].map(([code, meaning, action]) => (
                        <tr key={code} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-2 font-mono font-medium text-brick">{code}</td>
                          <td className="px-4 py-2 text-neutral-700">{meaning}</td>
                          <td className="px-4 py-2 text-neutral-500">{action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ---------------- QUOTAS ---------------- */}
              <div id="quotas" className="scroll-mt-24">
                <h2 className="mb-4 font-display text-2xl font-medium text-ink">Quotas et paliers</h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Palier</th>
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Requêtes / mois</th>
                        <th className="px-4 py-2 font-mono text-xs uppercase text-neutral-500">Recommandé pour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Trial', '100', 'Tester une intégration'],
                        ['Starter', '2 000', 'Petite application ou usage régulier'],
                        ['Pro', '20 000', 'Usage professionnel à volume important'],
                      ].map(([tier, quota, usage]) => (
                        <tr key={tier} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-2 font-medium text-ink">{tier}</td>
                          <td className="px-4 py-2 font-mono text-neutral-700">{quota}</td>
                          <td className="px-4 py-2 text-neutral-500">{usage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-neutral-600">
                  Les quotas se renouvellent automatiquement le 1er de chaque mois. Le tarif de chaque palier est
                  établi sur devis, selon votre usage — contactez-nous pour en discuter.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
                <h3 className="font-display text-xl font-medium text-ink">Une question technique ?</h3>
                <p className="mt-2 text-sm text-neutral-600">Notre équipe répond rapidement aux questions d'intégration.</p>
                <a
                  href={mailtoLink('Question technique API — ASILLIA DataInsight')}
                  className="mt-4 inline-block rounded-full bg-violet-gradient px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Nous écrire
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}