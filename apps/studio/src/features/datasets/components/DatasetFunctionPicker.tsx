//apps/studio/src/features/datasets/components/DatasetFunctionPicker.tsx
import { useState } from 'react';
import type { DatasetColumnDef } from '../../../engine/flexible/types';
import { getAvailableFlexibleFunctions, columnsWithRole } from '../../../engine/flexible/registry';
import type { FlexibleFunctionConfig } from '../utils/functionConfigTypes';
import type { Dataset } from '../../../api/datasets';
import Checkbox from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

interface DatasetFunctionPickerProps {
  columns: DatasetColumnDef[];
  otherDatasets: Dataset[]; // autres datasets de la même structure, pour "compare_snapshots"
  onChange: (configs: FlexibleFunctionConfig[]) => void;
}

/**
 * Contrairement à FunctionPicker (engine/registry, catégories fixes), ici
 * chaque fonction sélectionnée nécessite de préciser QUELLES colonnes
 * utiliser — puisque le mapping est différent à chaque dataset importé.
 */
export default function DatasetFunctionPicker({ columns, otherDatasets, onChange }: DatasetFunctionPickerProps) {
  const dimensionColumns = columnsWithRole(columns, 'DIMENSION');
  const metricColumns = columnsWithRole(columns, 'METRIC');
  const identifierColumns = columnsWithRole(columns, 'IDENTIFIER');
  const available = getAvailableFlexibleFunctions(columns);

  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<Record<string, Partial<FlexibleFunctionConfig>>>({});

  function toggle(id: string, checked: boolean) {
    const nextEnabled = { ...enabled, [id]: checked };
    setEnabled(nextEnabled);
    emitChange(nextEnabled, configs);
  }

  function updateConfig(id: string, patch: Partial<FlexibleFunctionConfig>) {
    const nextConfigs = { ...configs, [id]: { ...configs[id], ...patch } };
    setConfigs(nextConfigs);
    emitChange(enabled, nextConfigs);
  }

  function emitChange(enabledMap: Record<string, boolean>, configMap: Record<string, Partial<FlexibleFunctionConfig>>) {
    const result: FlexibleFunctionConfig[] = [];

    if (enabledMap.aggregate_by_dimension && configMap.aggregate_by_dimension) {
      const c = configMap.aggregate_by_dimension as any;
      if (c.dimensionKey) result.push({ type: 'aggregate_by_dimension', dimensionKey: c.dimensionKey, metricKey: c.metricKey, aggregation: c.aggregation ?? 'SUM' });
    }
    if (enabledMap.aggregate_by_dimensions && configMap.aggregate_by_dimensions) {
      const c = configMap.aggregate_by_dimensions as any;
      if (c.dimensionKeys?.length >= 2) result.push({ type: 'aggregate_by_dimensions', dimensionKeys: c.dimensionKeys, metricKey: c.metricKey, aggregation: c.aggregation ?? 'SUM' });
    }
    if (enabledMap.top_n_by_dimension && configMap.top_n_by_dimension) {
      const c = configMap.top_n_by_dimension as any;
      if (c.dimensionKey) result.push({ type: 'top_n_by_dimension', dimensionKey: c.dimensionKey, metricKey: c.metricKey, n: c.n ?? 5 });
    }
    if (enabledMap.cross_correlate_columns && configMap.cross_correlate_columns) {
      const c = configMap.cross_correlate_columns as any;
      if (c.columnAKey && c.columnBKey) result.push({ type: 'cross_correlate_columns', columnAKey: c.columnAKey, columnBKey: c.columnBKey });
    }
    if (enabledMap.detect_anomalies && configMap.detect_anomalies) {
      const c = configMap.detect_anomalies as any;
      if (c.metricKey) result.push({ type: 'detect_anomalies', metricKey: c.metricKey, identifierKey: c.identifierKey });
    }
    if (enabledMap.compare_snapshots && configMap.compare_snapshots) {
      const c = configMap.compare_snapshots as any;
      if (c.previousDatasetId) result.push({ type: 'compare_snapshots', previousDatasetId: c.previousDatasetId, metricKeys: metricColumns.map((m) => m.key) });
    }

    onChange(result);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
        Fonctions d'analyse disponibles
      </span>

      {available.length === 0 && (
        <p className="text-sm text-neutral-400">
          Aucune fonction disponible — vérifiez qu'au moins une colonne est marquée "Dimension" ou "Mesure" dans le mapping.
        </p>
      )}

      {available.some((fn) => fn.id === 'aggregate_by_dimension') && (
        <div className="border border-neutral-200 p-3">
          <Checkbox
            label="Agréger par dimension"
            description="Somme, moyenne ou compte d'une mesure, groupée par une dimension."
            checked={!!enabled.aggregate_by_dimension}
            onChange={(c) => toggle('aggregate_by_dimension', c)}
          />
          {enabled.aggregate_by_dimension && (
            <div className="mt-3 grid grid-cols-3 gap-2 pl-7">
              <Select
                label="Dimension"
                value={(configs.aggregate_by_dimension as any)?.dimensionKey ?? ''}
                onChange={(v) => updateConfig('aggregate_by_dimension', { dimensionKey: v } as any)}
                options={dimensionColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Choisir"
              />
              <Select
                label="Mesure (optionnel)"
                value={(configs.aggregate_by_dimension as any)?.metricKey ?? ''}
                onChange={(v) => updateConfig('aggregate_by_dimension', { metricKey: v } as any)}
                options={metricColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Aucune (compte)"
              />
              <Select
                label="Calcul"
                value={(configs.aggregate_by_dimension as any)?.aggregation ?? 'SUM'}
                onChange={(v) => updateConfig('aggregate_by_dimension', { aggregation: v } as any)}
                options={[
                  { label: 'Somme', value: 'SUM' },
                  { label: 'Moyenne', value: 'AVERAGE' },
                  { label: 'Compte', value: 'COUNT' },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {available.some((fn) => fn.id === 'aggregate_by_dimensions') && (
        <div className="border border-neutral-200 p-3">
          <Checkbox
            label="Agréger par plusieurs dimensions"
            description="Croise 2 dimensions ou plus (ex: catégorie × mode de paiement)."
            checked={!!enabled.aggregate_by_dimensions}
            onChange={(c) => toggle('aggregate_by_dimensions', c)}
          />
          {enabled.aggregate_by_dimensions && (
            <div className="mt-3 flex flex-col gap-3 pl-7">
              <div>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Dimensions à croiser (2 minimum)
                </span>
                <div className="flex flex-col gap-1.5">
                  {dimensionColumns.map((dc) => {
                    const current: string[] = (configs.aggregate_by_dimensions as any)?.dimensionKeys ?? [];
                    const isChecked = current.includes(dc.key);
                    return (
                      <Checkbox
                        key={dc.key}
                        label={dc.name}
                        checked={isChecked}
                        onChange={(checked) => {
                          const next = checked ? [...current, dc.key] : current.filter((k) => k !== dc.key);
                          updateConfig('aggregate_by_dimensions', { dimensionKeys: next } as any);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Mesure (optionnel)"
                  value={(configs.aggregate_by_dimensions as any)?.metricKey ?? ''}
                  onChange={(v) => updateConfig('aggregate_by_dimensions', { metricKey: v } as any)}
                  options={metricColumns.map((c) => ({ label: c.name, value: c.key }))}
                  placeholder="Aucune (compte)"
                />
                <Select
                  label="Calcul"
                  value={(configs.aggregate_by_dimensions as any)?.aggregation ?? 'SUM'}
                  onChange={(v) => updateConfig('aggregate_by_dimensions', { aggregation: v } as any)}
                  options={[
                    { label: 'Somme', value: 'SUM' },
                    { label: 'Moyenne', value: 'AVERAGE' },
                    { label: 'Compte', value: 'COUNT' },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {available.some((fn) => fn.id === 'top_n_by_dimension') && (
        <div className="border border-neutral-200 p-3">
          <Checkbox
            label="Classement (Top N)"
            description="Classe les valeurs d'une dimension par ordre décroissant."
            checked={!!enabled.top_n_by_dimension}
            onChange={(c) => toggle('top_n_by_dimension', c)}
          />
          {enabled.top_n_by_dimension && (
            <div className="mt-3 grid grid-cols-3 gap-2 pl-7">
              <Select
                label="Dimension"
                value={(configs.top_n_by_dimension as any)?.dimensionKey ?? ''}
                onChange={(v) => updateConfig('top_n_by_dimension', { dimensionKey: v } as any)}
                options={dimensionColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Choisir"
              />
              <Select
                label="Mesure (optionnel)"
                value={(configs.top_n_by_dimension as any)?.metricKey ?? ''}
                onChange={(v) => updateConfig('top_n_by_dimension', { metricKey: v } as any)}
                options={metricColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Aucune (compte)"
              />
              <Input
                label="Top N"
                type="number"
                value={String((configs.top_n_by_dimension as any)?.n ?? 5)}
                onChange={(e) => updateConfig('top_n_by_dimension', { n: Number(e.target.value) } as any)}
              />
            </div>
          )}
        </div>
      )}

      {available.some((fn) => fn.id === 'cross_correlate_columns') && (
        <div className="border border-neutral-200 p-3">
          <Checkbox
            label="Corrélation entre deux mesures"
            description="Mesure si deux colonnes numériques évoluent ensemble."
            checked={!!enabled.cross_correlate_columns}
            onChange={(c) => toggle('cross_correlate_columns', c)}
          />
          {enabled.cross_correlate_columns && (
            <div className="mt-3 grid grid-cols-2 gap-2 pl-7">
              <Select
                label="Mesure A"
                value={(configs.cross_correlate_columns as any)?.columnAKey ?? ''}
                onChange={(v) => updateConfig('cross_correlate_columns', { columnAKey: v } as any)}
                options={metricColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Choisir"
              />
              <Select
                label="Mesure B"
                value={(configs.cross_correlate_columns as any)?.columnBKey ?? ''}
                onChange={(v) => updateConfig('cross_correlate_columns', { columnBKey: v } as any)}
                options={metricColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Choisir"
              />
            </div>
          )}
        </div>
      )}

      {available.some((fn) => fn.id === 'detect_anomalies') && (
        <div className="border border-neutral-200 p-3">
          <Checkbox
            label="Détection d'anomalies"
            description="Repère les valeurs statistiquement aberrantes dans une mesure."
            checked={!!enabled.detect_anomalies}
            onChange={(c) => toggle('detect_anomalies', c)}
          />
          {enabled.detect_anomalies && (
            <div className="mt-3 grid grid-cols-2 gap-2 pl-7">
              <Select
                label="Mesure"
                value={(configs.detect_anomalies as any)?.metricKey ?? ''}
                onChange={(v) => updateConfig('detect_anomalies', { metricKey: v } as any)}
                options={metricColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Choisir"
              />
              <Select
                label="Identifiant (optionnel)"
                value={(configs.detect_anomalies as any)?.identifierKey ?? ''}
                onChange={(v) => updateConfig('detect_anomalies', { identifierKey: v } as any)}
                options={identifierColumns.map((c) => ({ label: c.name, value: c.key }))}
                placeholder="Aucun"
              />
            </div>
          )}
        </div>
      )}

      {available.some((fn) => fn.id === 'compare_snapshots') && otherDatasets.length > 0 && (
        <div className="border border-neutral-200 p-3">
          <Checkbox
            label="Comparer avec un autre dataset"
            description="Compare les mesures avec un dataset déjà importé pour cette structure."
            checked={!!enabled.compare_snapshots}
            onChange={(c) => toggle('compare_snapshots', c)}
          />
          {enabled.compare_snapshots && (
            <div className="mt-3 pl-7">
              <Select
                label="Dataset à comparer"
                value={(configs.compare_snapshots as any)?.previousDatasetId ?? ''}
                onChange={(v) => updateConfig('compare_snapshots', { previousDatasetId: v } as any)}
                options={otherDatasets.map((d) => ({ label: `${d.name} (${d.period_label ?? 'sans période'})`, value: d.$id }))}
                placeholder="Choisir"
              />
              <p className="mt-2 text-xs text-neutral-400">
                Suppose que les colonnes portent les mêmes noms dans les deux fichiers.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}