// apps/client-dashboard/src/features/reports/components/ReportCard.tsx
import type { WeeklyReport } from '@datainsight/shared';
import Card from '../../../components/ui/Card';
import DownloadPdfButton from './DownloadPdfButton';

export default function ReportCard({ report }: { report: WeeklyReport }) {
  const cardId = `report-${report.$id}`;

  return (
    <Card className="report-card" id={cardId}>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
        Semaine {report.week_number} — {report.year}
      </div>

      <h2 className="mb-4 font-display text-2xl font-medium text-ink">
        {report.published_at &&
          new Date(report.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </h2>

      <div className="mb-1 h-px bg-neutral-200" />

      <p className="my-6 whitespace-pre-line text-[15px] leading-[1.8] text-ink">{report.ai_directives}</p>

      <div className="mb-6 h-px bg-neutral-200" />

      <DownloadPdfButton targetId={cardId} />
    </Card>
  );
}