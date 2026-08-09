//apps/studio/src/features/studio/reports/components/ReportEditor.tsx
import { useState } from 'react';
import type { WeeklyReport } from '@datainsight/shared';
import { publishReport } from '../../../api/reports';
import { getCurrentSession } from '../../../api/auth';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

interface ReportEditorProps {
  report: WeeklyReport;
  onUpdated: (report: WeeklyReport) => void;
}

// Permet de relire/republier un rapport déjà généré (ex: correction d'une
// directive après publication, ou publication tardive d'un brouillon oublié).
export default function ReportEditor({ report, onUpdated }: ReportEditorProps) {
  const [publishing, setPublishing] = useState(false);

  let parsedResults: Array<{ metricName: string; status: string }> = [];
  try {
    parsedResults = JSON.parse(report.analysis_result);
  } catch {
    parsedResults = [];
  }

  async function handlePublish() {
    if (!report.$id) return;
    setPublishing(true);
    try {
      const session = await getCurrentSession();
      const updated = await publishReport(report.$id, session.userId);
      onUpdated(updated);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">
          Semaine {report.week_number} — {report.year}
        </h3>
        <Badge status={report.status} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {parsedResults.map((r, i) => (
          <span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
            {r.metricName}
          </span>
        ))}
      </div>

      <p className="mb-3 whitespace-pre-line text-sm text-neutral-700">{report.ai_directives}</p>

      {report.status === 'DRAFT' && (
        <Button onClick={handlePublish} loading={publishing}>
          Publier maintenant
        </Button>
      )}
    </Card>
  );
}