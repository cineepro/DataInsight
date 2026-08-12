//apps/client-dashboard/src/features/reports/components/DatasetReportCard.tsx
import { useEffect, useState } from 'react';
import type { DatasetReport, DatasetInfo } from '../../../api/reports';
import { getDatasetInfo } from '../../../api/reports';
import Card from '../../../components/ui/Card';
import DownloadPdfButton from './DownloadPdfButton';

export default function DatasetReportCard({ report }: { report: DatasetReport }) {
  const cardId = `dataset-report-${report.$id}`;
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);

  useEffect(() => {
    getDatasetInfo(report.dataset_id).then(setDatasetInfo);
  }, [report.dataset_id]);

  return (
    <Card className="report-card" id={cardId}>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
        {datasetInfo?.period_label ?? 'Analyse spéciale'}
      </div>

      <h2 className="mb-1 font-display text-2xl font-medium text-ink">
        {datasetInfo?.name ?? 'Analyse de données'}
      </h2>

      <p className="mb-4 text-xs text-neutral-400">
        {report.published_at &&
          new Date(report.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="mb-1 h-px bg-neutral-200" />

      <p className="my-6 whitespace-pre-line text-[15px] leading-[1.8] text-ink">{report.ai_directives}</p>

      <div className="mb-6 h-px bg-neutral-200" />

      <DownloadPdfButton targetId={cardId} />
    </Card>
  );
}