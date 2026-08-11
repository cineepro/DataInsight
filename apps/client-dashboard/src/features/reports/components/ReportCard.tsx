// apps/client-dashboard/src/features/reports/components/ReportCard.tsx
import type { WeeklyReport } from '@datainsight/shared';
import Card from '../../../components/ui/Card';
import DownloadPdfButton from './DownloadPdfButton';

export default function ReportCard({ report }: { report: WeeklyReport }) {
  const cardId = `report-${report.$id}`;

  return (
    <Card className="report-card" id={cardId}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">
          Semaine {report.week_number} — {report.year}
        </h3>
        <span className="text-xs text-neutral-400">
          {report.published_at && new Date(report.published_at).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <p className="mb-4 whitespace-pre-line text-sm text-neutral-700">{report.ai_directives}</p>

      <DownloadPdfButton targetId={cardId} />
    </Card>
  );
}