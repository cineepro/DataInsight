//apps/studio/src/features/studio/pages/StudioPage.tsx
import { useState } from 'react';
import type { AnalysisResult, Tenant, TenantCategory } from '@datainsight/shared';
import { getISOYearWeek, formatWeekLabel } from '@datainsight/shared';
import { fetchRestaurantScans, fetchPharmacieScans, fetchEntrepriseScans } from '../../../api/scans';
import { saveDraftReport, publishReport } from '../../../api/reports';
import { getCurrentSession } from '../../../api/auth';
import { getFunctionsForCategory } from '../../../engine/registry';
import { generateDirectives } from '../../../ai/generateDirectives';

import StructureSelector from '../components/StructureSelector';
import PeriodSelector from '../components/PeriodSelector';
import FunctionPicker from '../components/FunctionPicker';
import RunAnalysisButton from '../components/RunAnalysisButton';
import ResultReviewPanel from '../components/ResultReviewPanel';
import Card from '../../../components/ui/Card';

const initialPeriod = getISOYearWeek();

export default function StudioPage() {
  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [year, setYear] = useState(initialPeriod.year);
  const [weekNumber, setWeekNumber] = useState(initialPeriod.week_number);
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<string[]>([]);

  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [directives, setDirectives] = useState('');
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function fetchScansForCategory(cat: TenantCategory, tenantId: string, y: number, w: number) {
    if (cat === 'RESTAURANT' || cat === 'FASTFOOD') return fetchRestaurantScans(tenantId, y, w);
    if (cat === 'PHARMACIE') return fetchPharmacieScans(tenantId, y, w);
    return fetchEntrepriseScans(tenantId, y, w);
  }

  async function handleRunAnalysis() {
    if (!tenant || !category) return;
    setRunning(true);
    setResults(null);

    try {
      const scans = await fetchScansForCategory(category, tenant.slug, year, weekNumber);

      // Semaine précédente, chargée seulement si utile (comparePeriodCrossMetrics)
      const previousWeek = weekNumber > 1 ? weekNumber - 1 : 52;
      const previousYear = weekNumber > 1 ? year : year - 1;
      const previousPeriodScans = await fetchScansForCategory(category, tenant.slug, previousYear, previousWeek);

      const availableFunctions = getFunctionsForCategory(category);
      const selectedFunctions = availableFunctions.filter((fn) => selectedFunctionIds.includes(fn.id));

      const analysisResults: AnalysisResult[] = selectedFunctions.map((fn) =>
        // @ts-expect-error — le typage générique par catégorie est garanti au runtime par getFunctionsForCategory
        fn.run(scans, { tenantId: tenant.slug, year, weekNumber, previousPeriodScans })
      );

      setResults(analysisResults);

      const period = formatWeekLabel(year, weekNumber);
      const generatedText = await generateDirectives(tenant, period, analysisResults);
      setDirectives(generatedText);

      // Sauvegarde immédiate en brouillon pour ne rien perdre
      await saveDraftReport({
        tenant_id: tenant.slug,
        year,
        week_number: weekNumber,
        analysis_result: JSON.stringify(analysisResults),
        ai_directives: generatedText,
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse. Vérifiez la console.");
    } finally {
      setRunning(false);
    }
  }

  async function handlePublish() {
    if (!tenant || !results) return;
    setPublishing(true);
    try {
      const session = await getCurrentSession();
      const draft = await saveDraftReport({
        tenant_id: tenant.slug,
        year,
        week_number: weekNumber,
        analysis_result: JSON.stringify(results),
        ai_directives: directives,
      });
      if (draft.$id) {
        await publishReport(draft.$id, session.userId);
        alert('Rapport publié !');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  }

  const canRun = !!tenant && selectedFunctionIds.length > 0;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Studio d'analyse</h1>

      <Card className="mb-4">
        <div className="flex flex-col gap-4">
          <StructureSelector
            category={category}
            tenantId={tenant?.$id ?? ''}
            onCategoryChange={(cat) => {
              setCategory(cat);
              setTenant(null);
              setResults(null);
              setSelectedFunctionIds([]);
            }}
            onTenantChange={(t) => {
              setTenant(t);
              setResults(null);
            }}
          />

          <PeriodSelector
            year={year}
            weekNumber={weekNumber}
            onChange={(y, w) => {
              setYear(y);
              setWeekNumber(w);
              setResults(null);
            }}
          />

          {category && (
            <FunctionPicker
              category={category}
              selectedIds={selectedFunctionIds}
              onChange={setSelectedFunctionIds}
            />
          )}

          <RunAnalysisButton disabled={!canRun} loading={running} onRun={handleRunAnalysis} />
        </div>
      </Card>

      {results && tenant && (
        <ResultReviewPanel
          results={results}
          directives={directives}
          onDirectivesChange={setDirectives}
          onPublish={handlePublish}
          publishing={publishing}
        />
      )}
    </div>
  );
}