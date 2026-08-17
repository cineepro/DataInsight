//apps/studio/src/features/datasets/pages/DatasetDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getReportForDataset } from '../../../api/datasets';
import {
  getDataset,
  listDatasetsForTenant,
  listDatasetColumns,
  listDatasetRows,
  saveDatasetColumns,
  insertDatasetRows,
  updateDatasetStatus,
  saveDraftDatasetReport,
  publishDatasetReport,
  type Dataset,
} from '../../../api/datasets';
import { getTenantBySlug } from '../../../api/tenants';
import { getCurrentSession } from '../../../api/auth';
import { generateDatasetDirectives } from '../../../ai/generateDirectives';
import { parseSpreadsheet } from '../utils/parseSpreadsheet';
import { inferColumnType, slugifyColumnKey } from '../utils/inferColumnType';
import type { DatasetColumnDef, DatasetRow, AnalysisResult } from '../../../engine/flexible/types';
import type { FlexibleFunctionConfig } from '../utils/functionConfigTypes';
import { aggregateByDimension } from '../../../engine/flexible/aggregateByDimension';
import { topNByDimension } from '../../../engine/flexible/topNByDimension';
import { crossCorrelateColumns } from '../../../engine/flexible/crossCorrelateColumns';
import { detectAnomaliesInColumn } from '../../../engine/flexible/detectAnomaliesInColumn';
import { compareDatasetSnapshots } from '../../../engine/flexible/compareDatasetSnapshots';

import DatasetPreviewTable from '../components/DatasetPreviewTable';
import ColumnMappingTable, { type ColumnMappingRow } from '../components/ColumnMappingTable';
import DatasetFunctionPicker from '../components/DatasetFunctionPicker';
import DatasetResultPanel from '../components/DatasetResultPanel';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';

export default function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Étape mapping (dataset encore DRAFT) ---
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [mappingRows, setMappingRows] = useState<ColumnMappingRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // --- Étape analyse (dataset IMPORTED/ANALYZED) ---
  const [columns, setColumns] = useState<DatasetColumnDef[]>([]);
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const [otherDatasets, setOtherDatasets] = useState<Dataset[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<FlexibleFunctionConfig[]>([]);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [directives, setDirectives] = useState('');
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadDataset();
  }, [id]);

  async function loadDataset() {
    if (!id) return;
    setLoading(true);
    const d = await getDataset(id);
    setDataset(d);

    if (d.status === 'DRAFT') {
      const file = (location.state as { file?: File } | null)?.file;
      if (file) {
        const parsed = await parseSpreadsheet(file);
        setPreviewHeaders(parsed.headers);
        setPreviewRows(parsed.rows);

        const initialMapping: ColumnMappingRow[] = parsed.headers.map((header, index) => {
          const values = parsed.rows.map((r) => r[header]);
          const inferred = inferColumnType(values);
          return {
            name: header,
            key: slugifyColumnKey(header) || `col_${index}`,
            data_type: inferred.dataType,
            role: inferred.suggestedRole,
            order: index,
            sampleValues: values.slice(0, 3).map((v) => String(v ?? '')),
          };
        });
        setMappingRows(initialMapping);
      }
    } else {
  const [cols, dsRows, siblings, existingReport] = await Promise.all([
    listDatasetColumns(d.$id),
    listDatasetRows(d.$id),
    listDatasetsForTenant(d.tenant_id),
    getReportForDataset(d.$id),
  ]);
  setColumns(cols);
  setRows(dsRows);
  setOtherDatasets(siblings.filter((s) => s.$id !== d.$id && s.status !== 'DRAFT'));

  if (existingReport) {
    setDirectives(existingReport.ai_directives ?? '');
    try {
      setResults(JSON.parse(existingReport.analysis_result));
    } catch {
      setResults(null);
    }
  }
}

    setLoading(false);
  }

  async function handleImport() {
    if (!dataset) return;
    setImporting(true);
    try {
      const savedColumns = await saveDatasetColumns(
        dataset.$id,
        mappingRows.map(({ sampleValues, ...col }) => col)
      );

      const rowsToInsert = previewRows.map((row, index) => {
        const payload: Record<string, unknown> = {};
        for (const col of mappingRows) {
          payload[col.key] = row[col.name];
        }
        return { row_index: index, payload };
      });

      await insertDatasetRows(dataset.$id, rowsToInsert, (current, total) =>
        setImportProgress({ current, total })
      );

      await updateDatasetStatus(dataset.$id, 'IMPORTED', {
        row_count: rowsToInsert.length,
        column_count: savedColumns.length,
      });

      await loadDataset();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'import des données.");
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }

  async function runConfig(config: FlexibleFunctionConfig, periodLabel: string): Promise<AnalysisResult | null> {
  const findCol = (key: string) => columns.find((c) => c.key === key) ?? null;

  switch (config.type) {
    case 'aggregate_by_dimension': {
      const dim = findCol(config.dimensionKey);
      if (!dim) return null;
      return aggregateByDimension(rows, dim, config.metricKey ? findCol(config.metricKey) : null, config.aggregation, periodLabel);
    }
    case 'top_n_by_dimension': {
      const dim = findCol(config.dimensionKey);
      if (!dim) return null;
      return topNByDimension(rows, dim, config.metricKey ? findCol(config.metricKey) : null, config.n, periodLabel);
    }
    case 'cross_correlate_columns': {
      const a = findCol(config.columnAKey);
      const b = findCol(config.columnBKey);
      if (!a || !b) return null;
      return await crossCorrelateColumns(rows, a, b, periodLabel); // AVANT : sans await
    }
    case 'detect_anomalies': {
      const metric = findCol(config.metricKey);
      if (!metric) return null;
      return await detectAnomaliesInColumn(rows, metric, config.identifierKey ? findCol(config.identifierKey) : null, periodLabel); // AVANT : sans await
    }
    case 'compare_snapshots': {
      return null;
    }
  }
}
  async function handleRunAnalysis() {
    if (!dataset) return;
    setRunning(true);
    setResults(null);

    try {
      const periodLabel = dataset.period_label ?? dataset.name;
      const computedResults: AnalysisResult[] = [];

      for (const config of selectedConfigs) {
        if (config.type === 'compare_snapshots') {
          const previousRows = await listDatasetRows(config.previousDatasetId);
          const metricCols = config.metricKeys.map((k) => columns.find((c) => c.key === k)).filter((c): c is DatasetColumnDef => !!c);
          const previousDataset = otherDatasets.find((d) => d.$id === config.previousDatasetId);
          computedResults.push(
            compareDatasetSnapshots(
              rows,
              previousRows,
              metricCols,
              periodLabel,
              previousDataset?.period_label ?? previousDataset?.name ?? 'Période précédente'
            )
          );
        } else {
  const result = await runConfig(config, periodLabel); // AVANT : sans await
  if (result) computedResults.push(result);
}
      }

      // APRÈS — les fonctions engine/flexible/ ne sont PAS encore migrées à ce
// stade (ce sera un chantier séparé, elles n'utilisent pas encore
// getThresholds), donc ce fichier n'a besoin d'aucun changement pour
// l'instant. Je le note ici pour mémoire : quand on migrera
// flexible.cross_correlate et flexible.detect_anomalies, runConfig()
// devra devenir async et cet appel devra passer par un await/Promise.all,
// exactement le même principe que pour StudioPage.

      setResults(computedResults);

      const tenant = await getTenantBySlug(dataset.tenant_id);
      if (!tenant) throw new Error('Structure introuvable.');

      const generatedText = await generateDatasetDirectives(tenant, dataset.name, periodLabel, computedResults);
      setDirectives(generatedText);

      await saveDraftDatasetReport({
        dataset_id: dataset.$id,
        tenant_id: dataset.tenant_id,
        analysis_result: JSON.stringify(computedResults),
        ai_directives: generatedText,
      });

      await updateDatasetStatus(dataset.$id, 'ANALYZED');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse.");
    } finally {
      setRunning(false);
    }
  }

  async function handlePublish() {
    if (!dataset || !results) return;
    setPublishing(true);
    try {
      const session = await getCurrentSession();
      const draft = await saveDraftDatasetReport({
        dataset_id: dataset.$id,
        tenant_id: dataset.tenant_id,
        analysis_result: JSON.stringify(results),
        ai_directives: directives,
      });
      if (draft.$id) {
        await publishDatasetReport(draft.$id, session.userId, dataset.tenant_id);
        alert('Rapport publié !');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div className="px-5 py-8 text-sm text-neutral-400">Chargement...</div>;
  }

  if (!dataset) {
    return <div className="px-5 py-8 text-sm text-neutral-400">Dataset introuvable.</div>;
  }

  // --- Cas DRAFT sans fichier en mémoire (ex: page rafraîchie) ---
  if (dataset.status === 'DRAFT' && previewHeaders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Card>
          <p className="mb-4 text-sm text-neutral-600">
            Le fichier source n'est plus disponible en mémoire (probablement suite à un rafraîchissement de page).
            Ce brouillon ne peut pas être repris — supprimez-le et réimportez le fichier.
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
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Dataset</span>
        <h1 className="font-display text-2xl font-medium text-ink">{dataset.name}</h1>
      </div>

      {dataset.status === 'DRAFT' ? (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-2 text-sm font-medium text-ink">Aperçu du fichier</h2>
            <DatasetPreviewTable headers={previewHeaders} rows={previewRows} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-ink">Mapping des colonnes</h2>
            <ColumnMappingTable columns={mappingRows} onChange={setMappingRows} />
          </div>

          {importProgress && (
            <ProgressBar current={importProgress.current} total={importProgress.total} label="Import en cours" />
          )}

          <Button onClick={handleImport} loading={importing}>
            Valider le mapping et importer {previewRows.length} lignes
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <DatasetFunctionPicker columns={columns} otherDatasets={otherDatasets} onChange={setSelectedConfigs} />
            <Button onClick={handleRunAnalysis} disabled={selectedConfigs.length === 0} loading={running} className="mt-4 w-full">
              Lancer l'analyse
            </Button>
          </Card>

          {results && (
            <DatasetResultPanel
              results={results}
              directives={directives}
              onDirectivesChange={setDirectives}
              onPublish={handlePublish}
              publishing={publishing}
            />
          )}
        </div>
      )}
    </div>
  );
}