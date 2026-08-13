//apps/studio/src/features/studio/pages/StudioPage.tsx
import { useEffect, useState } from 'react';
import type { AnalysisResult, Tenant, TenantCategory } from '@datainsight/shared';
import { getISOYearWeek, formatWeekLabel } from '@datainsight/shared';
import { fetchRestaurantScans, fetchPharmacieScans, fetchEntrepriseScans } from '../../../api/scans';
import { saveDraftReport, publishReport, getReportForWeek } from '../../../api/reports';
import { getCurrentSession } from '../../../api/auth';
import { getFunctionsForCategory } from '../../../engine/registry';
import { generateDirectives } from '../../../ai/generateDirectives';

import StructureSelector from '../components/StructureSelector';
import PeriodSelector from '../components/PeriodSelector';
import FunctionPicker from '../components/FunctionPicker';
import RunAnalysisButton from '../components/RunAnalysisButton';
import ResultReviewPanel from '../components/ResultReviewPanel';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

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
  const [existingReportStatus, setExistingReportStatus] = useState<'DRAFT' | 'PUBLISHED' | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  async function fetchScansForCategory(cat: TenantCategory, tenantId: string, y: number, w: number) {
    if (cat === 'RESTAURANT' || cat === 'FASTFOOD') return fetchRestaurantScans(tenantId, y, w);
    if (cat === 'PHARMACIE') return fetchPharmacieScans(tenantId, y, w);
    return fetchEntrepriseScans(tenantId, y, w);
  }

  /**
   * Dès que structure + semaine sont connues, vérifie si un rapport existe
   * déjà pour cette combinaison — si oui, on le charge directement plutôt
   * que de repartir d'un formulaire vierge. Reproduit le même comportement
   * que DatasetDetailPage pour les analyses de données brutes.
   */
  useEffect(() => {
    if (!tenant) {
      setResults(null);
      setDirectives('');
      setExistingReportStatus(null);
      return;
    }

    let cancelled = false;
    setCheckingExisting(true);

    getReportForWeek(tenant.slug, year, weekNumber).then((existing) => {
      if (cancelled) return;
      if (existing) {
        setExistingReportStatus(existing.status);
        setDirectives(existing.ai_directives ?? '');
        try {
          setResults(JSON.parse(existing.analysis_result));
        } catch {
          setResults(null);
        }
      } else {
        setExistingReportStatus(null);
        setResults(null);
        setDirectives('');
      }
      setCheckingExisting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tenant, year, weekNumber]);

  async function handleRunAnalysis() {
    if (!tenant || !category) return;
    setRunning(true);
    setResults(null);

    try {
      const scans = await fetchScansForCategory(category, tenant.slug, year, weekNumber);
      const previousWeek = weekNumber > 1 ? weekNumber - 1 : 52;
      const previousYear = weekNumber > 1 ? year : year - 1;
      const previousPeriodScans = await fetchScansForCategory(category, tenant.slug, previousYear, previousWeek);

      const availableFunctions = getFunctionsForCategory(category);
      const selectedFunctions = availableFunctions.filter((fn) => selectedFunctionIds.includes(fn.id));

      const analysisResults: AnalysisResult[] = selectedFunctions.map((fn) =>
        // @ts-expect-error — typage garanti au runtime par getFunctionsForCategory
        fn.run(scans, { tenantId: tenant.slug, year, weekNumber, previousPeriodScans })
      );

      setResults(analysisResults);

      const period = formatWeekLabel(year, weekNumber);
      const generatedText = await generateDirectives(tenant, period, analysisResults);
      setDirectives(generatedText);

      await saveDraftReport({
        tenant_id: tenant.slug,
        year,
        week_number: weekNumber,
        analysis_result: JSON.stringify(analysisResults),
        ai_directives: generatedText,
      });
      setExistingReportStatus('DRAFT');
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
        setExistingReportStatus('PUBLISHED');
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
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Studio</span>
          <h1 className="font-display text-2xl font-medium text-ink">Lancer une analyse</h1>
        </div>
        {existingReportStatus && <Badge status={existingReportStatus} />}
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-5">
          <StructureSelector
            category={category}
            tenantId={tenant?.$id ?? ''}
            onCategoryChange={(cat) => {
              setCategory(cat);
              setTenant(null);
              setSelectedFunctionIds([]);
            }}
            onTenantChange={(t) => {
              setTenant(t);
            }}
          />

          <PeriodSelector
            year={year}
            weekNumber={weekNumber}
            onChange={(y, w) => {
              setYear(y);
              setWeekNumber(w);
            }}
          />

          {category && (
            <FunctionPicker
              category={category}
              selectedIds={selectedFunctionIds}
              onChange={setSelectedFunctionIds}
            />
          )}

          {existingReportStatus && (
            <p className="text-xs text-neutral-400">
              {existingReportStatus === 'PUBLISHED'
                ? 'Un rapport a déjà été publié pour cette période — relancer le traitement créera une nouvelle version en brouillon.'
                : 'Un brouillon existe déjà pour cette période — les résultats ci-dessous sont ceux déjà calculés.'}
            </p>
          )}

          <RunAnalysisButton disabled={!canRun} loading={running || checkingExisting} onRun={handleRunAnalysis} />
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