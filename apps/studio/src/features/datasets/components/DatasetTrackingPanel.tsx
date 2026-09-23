//apps/studio/src/features/datasets/components/DatasetTrackingPanel.tsx
import { useEffect, useState } from 'react';
import type { DatasetColumnDef, DatasetRow } from '../../../engine/flexible/types';
import { columnsWithRole } from '../../../engine/flexible/registry';
import { computeIndividualTracking, type TrackedIndividualResult } from '../../../engine/flexible/computeIndividualTracking';
import {
  getTrackingConfig,
  saveTrackingConfig,
  listTrackedIndividuals,
  saveTrackedIndividuals,
  type DatasetTrackingConfig,
  type TrackedIndividual,
} from '../../../api/datasetTracking';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import ProgressBar from '../../../components/ui/ProgressBar';

interface DatasetTrackingPanelProps {
  datasetId: string;
  tenantId: string;
  columns: DatasetColumnDef[];
  rows: DatasetRow[];
}

const STATUS_TO_BADGE = {
  ACTIVE: 'OPTIMAL',
  AT_RISK: 'WARNING',
} as const;

/**
 * Le pendant, pour les données importées, de ce que le suivi de fidélité
 * fait pour les clients issus des QR codes — mais entièrement à part,
 * jamais mélangé avec la collection `customers` ni les alertes de scan.
 * N'apparaît que si le dataset a au moins un Identifiant, une Date et une
 * Mesure — sans ces trois rôles, aucun suivi n'est configurable.
 */
export default function DatasetTrackingPanel({ datasetId, tenantId, columns, rows }: DatasetTrackingPanelProps) {
  const identifierColumns = columnsWithRole(columns, 'IDENTIFIER');
  const dateColumns = columnsWithRole(columns, 'DATE');
  const metricColumns = columnsWithRole(columns, 'METRIC');
  const dimensionColumns = columnsWithRole(columns, 'DIMENSION');

  const [config, setConfig] = useState<DatasetTrackingConfig | null>(null);
  const [individuals, setIndividuals] = useState<TrackedIndividual[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const [identifierKey, setIdentifierKey] = useState('');
  const [labelKey, setLabelKey] = useState('');
  const [periodKey, setPeriodKey] = useState('');
  const [activityKey, setActivityKey] = useState('');
  const [threshold, setThreshold] = useState('3');

  useEffect(() => {
    Promise.all([getTrackingConfig(datasetId), listTrackedIndividuals(datasetId)]).then(([c, list]) => {
      setConfig(c);
      setIndividuals(list);
      if (c) {
        setIdentifierKey(c.identifier_column_key);
        setLabelKey(c.label_column_key ?? '');
        setPeriodKey(c.period_column_key);
        setActivityKey(c.activity_column_key);
        setThreshold(String(c.inactivity_threshold));
      }
      setLoading(false);
    });
  }, [datasetId]);

  if (identifierColumns.length === 0 || dateColumns.length === 0 || (metricColumns.length === 0 && dimensionColumns.length === 0)) {
    return null; // pas assez de colonnes des bons rôles pour proposer un suivi
  }
  if (loading) return null;

  async function handleActivateAndCompute() {
    const identifierCol = columns.find((c) => c.key === identifierKey);
    const periodCol = columns.find((c) => c.key === periodKey);
    const activityCol = columns.find((c) => c.key === activityKey);
    const labelCol = labelKey ? columns.find((c) => c.key === labelKey) : null;
    if (!identifierCol || !periodCol || !activityCol) return;

    const thresholdNumber = Math.max(1, parseInt(threshold, 10) || 3);

    setComputing(true);
    try {
      const savedConfig = await saveTrackingConfig({
        dataset_id: datasetId,
        tenant_id: tenantId,
        identifier_column_key: identifierCol.key,
        label_column_key: labelCol?.key,
        period_column_key: periodCol.key,
        activity_column_key: activityCol.key,
        inactivity_threshold: thresholdNumber,
      });
      setConfig(savedConfig);

      const results: TrackedIndividualResult[] = computeIndividualTracking(
        rows,
        identifierCol,
        periodCol,
        activityCol,
        thresholdNumber,
        labelCol
      );
      await saveTrackedIndividuals(datasetId, tenantId, results, (current, total) => setProgress({ current, total }));
      setIndividuals(await listTrackedIndividuals(datasetId));
    } catch (err) {
      console.error(err);
      alert('Erreur lors du calcul du suivi.');
    } finally {
      setComputing(false);
      setProgress(null);
    }
  }

  const atRiskCount = individuals.filter((i) => i.status === 'AT_RISK').length;
  const sortedIndividuals = [...individuals].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'AT_RISK' ? -1 : 1;
    return a.label.localeCompare(b.label);
  });

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">Suivi individuel</h3>
        {individuals.length > 0 && (
          <span className="font-mono text-xs text-neutral-500">
            {individuals.length} suivi(s) — {atRiskCount} à risque
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-neutral-500">
        Suit chaque personne identifiée dans ce dataset au fil des périodes, et signale celles inactives depuis trop longtemps —
        l'équivalent, pour un fichier importé, du suivi de fidélité client.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Qui suivre (identifiant)"
          value={identifierKey}
          onChange={setIdentifierKey}
          options={identifierColumns.map((c) => ({ label: c.name, value: c.key }))}
          placeholder="Choisir"
        />
        <Select
          label="Libellé à afficher (optionnel)"
          value={labelKey}
          onChange={setLabelKey}
          options={dimensionColumns.map((c) => ({ label: c.name, value: c.key }))}
          placeholder="Aucun (affiche l'identifiant)"
        />
        <Select
          label="Sur quelle période"
          value={periodKey}
          onChange={setPeriodKey}
          options={(dateColumns.length > 0 ? dateColumns : dimensionColumns).map((c) => ({ label: c.name, value: c.key }))}
          placeholder="Choisir"
        />
        <Select
          label="Signal d'activité"
          value={activityKey}
          onChange={setActivityKey}
          options={(metricColumns.length > 0 ? metricColumns : dimensionColumns).map((c) => ({ label: c.name, value: c.key }))}
          placeholder="Choisir"
        />
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Seuil d'inactivité (périodes)
          </label>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <Button
          onClick={handleActivateAndCompute}
          loading={computing}
          disabled={!identifierKey || !periodKey || !activityKey}
          className="flex-1"
        >
          {config ? 'Recalculer le suivi' : 'Activer et calculer le suivi'}
        </Button>
      </div>

      {progress && (
        <div className="mt-3">
          <ProgressBar current={progress.current} total={progress.total} label="Enregistrement du suivi" />
        </div>
      )}

      {sortedIndividuals.length > 0 && (
        <div className="mt-5 max-h-96 overflow-y-auto border-t border-neutral-100 pt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-neutral-400">
                <th className="pb-2 font-mono uppercase tracking-wide">Personne</th>
                <th className="pb-2 font-mono uppercase tracking-wide">Dernière activité</th>
                <th className="pb-2 font-mono uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody>
              {sortedIndividuals.map((ind) => (
                <tr key={ind.$id} className="border-t border-neutral-100">
                  <td className="py-1.5 text-ink">{ind.label}</td>
                  <td className="py-1.5 text-neutral-500">{ind.last_active_period ?? '—'}</td>
                  <td className="py-1.5">
                    <Badge status={STATUS_TO_BADGE[ind.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
