//apps/studio/src/features/datasets/pages/DatasetJoinPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  listDatasetsForTenant,
  listDatasetColumns,
  listDatasetRows,
  createDataset,
  saveDatasetColumns,
  insertDatasetRows,
  updateDatasetStatus,
  type Dataset,
} from '../../../api/datasets';
import { getCurrentSession } from '../../../api/auth';
import { joinManyDatasets, type JoinableDataset, type JoinStep, type JoinType } from '../../../engine/flexible/joinDatasets';
import type { DatasetColumnDef } from '../../../engine/flexible/types';

import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import ProgressBar from '../../../components/ui/ProgressBar';
import DatasetPreviewTable from '../components/DatasetPreviewTable';

interface WizardStep {
  datasetId: string;
  keyColumnKey: string;
  previousKeyColumnKey: string;
  joinType: JoinType;
}

const JOIN_TYPE_OPTIONS = [
  { label: 'INNER — ne garder que les correspondances', value: 'INNER' },
  { label: 'LEFT — garder toutes les lignes de base', value: 'LEFT' },
];

/** Colonnes IDENTIFIER en tête de liste — ce sont les candidates naturelles pour une clé de jointure. */
function columnOptions(columns: DatasetColumnDef[]) {
  const sorted = [...columns].sort((a, b) => {
    if (a.role === 'IDENTIFIER' && b.role !== 'IDENTIFIER') return -1;
    if (b.role === 'IDENTIFIER' && a.role !== 'IDENTIFIER') return 1;
    return a.order - b.order;
  });
  return sorted.map((c) => ({ label: c.role === 'IDENTIFIER' ? `🔑 ${c.name}` : c.name, value: c.key }));
}

export default function DatasetJoinPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantId = (location.state as { tenantId?: string } | null)?.tenantId ?? '';

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [columnsByDataset, setColumnsByDataset] = useState<Record<string, DatasetColumnDef[]>>({});

  const [baseDatasetId, setBaseDatasetId] = useState('');
  const [baseKeyColumnKey, setBaseKeyColumnKey] = useState('');
  const [steps, setSteps] = useState<WizardStep[]>([]);

  const [mergedName, setMergedName] = useState('');
  const [previewResult, setPreviewResult] = useState<ReturnType<typeof joinManyDatasets> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [creating, setCreating] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoadingDatasets(false);
      return;
    }
    listDatasetsForTenant(tenantId).then((all) => {
      setDatasets(all.filter((d) => d.status !== 'DRAFT'));
      setLoadingDatasets(false);
    });
  }, [tenantId]);

  // Récupère les colonnes de tout dataset dès qu'il est choisi quelque part
  // dans l'assistant (base ou une étape) — les lignes, elles, ne sont
  // chargées qu'à l'aperçu ou à la création (coût réseau bien plus élevé).
  async function ensureColumnsLoaded(datasetId: string) {
    if (!datasetId || columnsByDataset[datasetId]) return;
    const cols = await listDatasetColumns(datasetId);
    setColumnsByDataset((prev) => ({ ...prev, [datasetId]: cols }));
  }

  useEffect(() => {
    if (baseDatasetId) ensureColumnsLoaded(baseDatasetId);
  }, [baseDatasetId]);

  useEffect(() => {
    steps.forEach((s) => {
      if (s.datasetId) ensureColumnsLoaded(s.datasetId);
    });
  }, [steps]);

  const baseColumns = columnsByDataset[baseDatasetId] ?? [];

  /**
   * Colonnes du résultat accumulé juste avant l'étape `uptoIndex` (0 = juste
   * après la base). Recalculé à partir du moteur réel mais avec des lignes
   * vides — donc quasi instantané, et garanti cohérent avec le vrai calcul
   * (même logique de renommage en cas de collision).
   */
  function accumulatedColumnsBefore(uptoIndex: number): DatasetColumnDef[] {
    if (!baseDatasetId || baseColumns.length === 0) return [];
    const baseAsJoinable: JoinableDataset = { datasetId: baseDatasetId, datasetLabel: 'base', columns: baseColumns, rows: [] };
    const priorSteps: JoinStep[] = steps.slice(0, uptoIndex).map((s) => ({
      dataset: {
        datasetId: s.datasetId,
        datasetLabel: datasets.find((d) => d.$id === s.datasetId)?.name ?? s.datasetId,
        columns: columnsByDataset[s.datasetId] ?? [],
        rows: [],
      },
      keyColumnKey: s.keyColumnKey,
      previousKeyColumnKey: s.previousKeyColumnKey,
      joinType: s.joinType,
    }));
    if (priorSteps.length === 0) return baseColumns;
    return joinManyDatasets(baseAsJoinable, priorSteps).columns;
  }

  const usedDatasetIds = useMemo(
    () => new Set([baseDatasetId, ...steps.map((s) => s.datasetId)].filter(Boolean)),
    [baseDatasetId, steps]
  );

  function addStep() {
    setSteps((prev) => [...prev, { datasetId: '', keyColumnKey: '', previousKeyColumnKey: '', joinType: 'INNER' }]);
    setPreviewResult(null);
  }

  function updateStep(index: number, patch: Partial<WizardStep>) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    setPreviewResult(null);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    setPreviewResult(null);
  }

  const isConfigComplete =
    !!baseDatasetId &&
    !!baseKeyColumnKey &&
    steps.length > 0 &&
    steps.every((s) => s.datasetId && s.keyColumnKey && s.previousKeyColumnKey);

  async function handlePreview() {
    setPreviewing(true);
    setPreviewError('');
    setPreviewResult(null);
    try {
      const baseRows = await listDatasetRows(baseDatasetId);
      const baseAsJoinable: JoinableDataset = { datasetId: baseDatasetId, datasetLabel: 'base', columns: baseColumns, rows: baseRows };

      const resolvedSteps: JoinStep[] = [];
      for (const s of steps) {
        const rows = await listDatasetRows(s.datasetId);
        resolvedSteps.push({
          dataset: {
            datasetId: s.datasetId,
            datasetLabel: datasets.find((d) => d.$id === s.datasetId)?.name ?? s.datasetId,
            columns: columnsByDataset[s.datasetId] ?? [],
            rows,
          },
          keyColumnKey: s.keyColumnKey,
          previousKeyColumnKey: s.previousKeyColumnKey,
          joinType: s.joinType,
        });
      }

      const result = joinManyDatasets(baseAsJoinable, resolvedSteps);
      setPreviewResult(result);

      if (!mergedName) {
        const baseLabel = datasets.find((d) => d.$id === baseDatasetId)?.name ?? 'Base';
        const otherLabels = steps.map((s) => datasets.find((d) => d.$id === s.datasetId)?.name ?? '').join(' + ');
        setMergedName(`Fusion — ${baseLabel} + ${otherLabels}`);
      }
    } catch (err) {
      console.error(err);
      setPreviewError("Erreur pendant le calcul de la fusion — vérifiez les colonnes clés choisies.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleCreateMergedDataset() {
    if (!previewResult || !mergedName) return;
    setCreating(true);
    try {
      const session = await getCurrentSession();
      const created = await createDataset({
        tenant_id: tenantId,
        name: mergedName,
        source_type: 'FUSION',
        uploaded_by: session.userId,
      });

      const savedColumns = await saveDatasetColumns(
        created.$id,
        previewResult.columns.map((c, i) => ({ name: c.name, key: c.key, data_type: c.data_type, role: c.role, order: i }))
      );

      const rowsToInsert = previewResult.rows.map((r, i) => ({ row_index: i, payload: r.payload }));
      await insertDatasetRows(created.$id, rowsToInsert, (current, total) => setImportProgress({ current, total }));

      await updateDatasetStatus(created.$id, 'IMPORTED', {
        row_count: rowsToInsert.length,
        column_count: savedColumns.length,
      });

      navigate(`/datasets/${created.$id}`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du dataset fusionné.');
    } finally {
      setCreating(false);
      setImportProgress(null);
    }
  }

  if (!tenantId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Card>
          <p className="mb-4 text-sm text-neutral-600">
            Aucune structure sélectionnée. Retournez à la liste des datasets et choisissez une structure avant de fusionner.
          </p>
          <Button variant="secondary" onClick={() => navigate('/datasets')}>
            Retour à la liste
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Datasets</span>
        <h1 className="font-display text-2xl font-medium text-ink">Fusionner plusieurs datasets</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Choisissez un dataset de base, puis ajoutez d'autres datasets à joindre dessus, un à un, chacun sur sa propre clé.
        </p>
      </div>

      {loadingDatasets ? (
        <p className="text-sm text-neutral-400">Chargement des datasets...</p>
      ) : datasets.length < 2 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            Il faut au moins 2 datasets déjà importés (statut autre que Brouillon) pour cette structure afin de pouvoir les fusionner.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="mb-3 text-sm font-medium text-ink">Dataset de base</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  label="Dataset"
                  value={baseDatasetId}
                  onChange={(v) => {
                    setBaseDatasetId(v);
                    setBaseKeyColumnKey('');
                    setPreviewResult(null);
                  }}
                  options={datasets
                    .filter((d) => !usedDatasetIds.has(d.$id) || d.$id === baseDatasetId)
                    .map((d) => ({ label: d.name, value: d.$id }))}
                  placeholder="Choisir le dataset de base"
                />
              </div>
              <div className="flex-1">
                <Select
                  label="Colonne clé"
                  value={baseKeyColumnKey}
                  onChange={(v) => {
                    setBaseKeyColumnKey(v);
                    setPreviewResult(null);
                  }}
                  options={columnOptions(baseColumns)}
                  placeholder="Choisir la colonne clé"
                />
              </div>
            </div>
          </Card>

          {steps.map((step, index) => {
            const prevCols = accumulatedColumnsBefore(index);
            const stepCols = columnsByDataset[step.datasetId] ?? [];
            return (
              <Card key={index}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-ink">Étape {index + 2} — ajouter un dataset</h2>
                  <button onClick={() => removeStep(index)} className="text-xs text-brick hover:underline">
                    Retirer
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Select
                        label="Dataset à ajouter"
                        value={step.datasetId}
                        onChange={(v) => updateStep(index, { datasetId: v, keyColumnKey: '' })}
                        options={datasets
                          .filter((d) => !usedDatasetIds.has(d.$id) || d.$id === step.datasetId)
                          .map((d) => ({ label: d.name, value: d.$id }))}
                        placeholder="Choisir un dataset"
                      />
                    </div>
                    <div className="flex-1">
                      <Select
                        label="Sa colonne clé"
                        value={step.keyColumnKey}
                        onChange={(v) => updateStep(index, { keyColumnKey: v })}
                        options={columnOptions(stepCols)}
                        placeholder="Choisir la colonne clé"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Select
                        label="Se joint sur (résultat accumulé)"
                        value={step.previousKeyColumnKey}
                        onChange={(v) => updateStep(index, { previousKeyColumnKey: v })}
                        options={columnOptions(prevCols)}
                        placeholder="Choisir la colonne correspondante"
                      />
                    </div>
                    <div className="flex-1">
                      <Select
                        label="Type de jointure"
                        value={step.joinType}
                        onChange={(v) => updateStep(index, { joinType: v as JoinType })}
                        options={JOIN_TYPE_OPTIONS}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          <Button variant="secondary" onClick={addStep} disabled={!baseDatasetId || !baseKeyColumnKey}>
            + Ajouter un dataset à joindre
          </Button>

          <Card>
            <Button onClick={handlePreview} disabled={!isConfigComplete} loading={previewing} className="w-full">
              Prévisualiser la fusion
            </Button>
            {previewError && <p className="mt-3 text-sm text-brick">{previewError}</p>}

            {previewResult && (
              <div className="mt-5 flex flex-col gap-3">
                <div className="flex gap-4 font-mono text-xs text-neutral-500">
                  <span>{previewResult.rows.length} lignes obtenues</span>
                  {previewResult.unmatchedBaseCount > 0 && (
                    <span className="text-marigold-600">{previewResult.unmatchedBaseCount} ligne(s) de base sans correspondance</span>
                  )}
                  {previewResult.unmatchedAdditionCount > 0 && (
                    <span className="text-marigold-600">{previewResult.unmatchedAdditionCount} ligne(s) ajoutée(s) sans correspondance</span>
                  )}
                </div>

                <DatasetPreviewTable
                  headers={previewResult.columns.map((c) => c.name)}
                  rows={previewResult.rows.map((r) => {
                    const named: Record<string, unknown> = {};
                    for (const c of previewResult.columns) named[c.name] = r.payload[c.key];
                    return named;
                  })}
                />

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Nom du dataset fusionné</label>
                  <input
                    value={mergedName}
                    onChange={(e) => setMergedName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>

                {importProgress && (
                  <ProgressBar current={importProgress.current} total={importProgress.total} label="Enregistrement en cours" />
                )}

                <Button onClick={handleCreateMergedDataset} loading={creating} disabled={!mergedName} className="w-full">
                  Créer ce dataset fusionné ({previewResult.rows.length} lignes)
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
