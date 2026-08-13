//apps/studio/src/features/studio/reports/components/DatasetReportEditor.tsx
import { useEffect, useState } from 'react';
import type { DatasetReport, Dataset } from '../../../../api/datasets';
import { getDataset, publishDatasetReport } from '../../../../api/datasets';
import { getCurrentSession } from '../../../../api/auth';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';

interface DatasetReportEditorProps {
  report: DatasetReport;
  onUpdated: (report: DatasetReport) => void;
}

export default function DatasetReportEditor({ report, onUpdated }: DatasetReportEditorProps) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    getDataset(report.dataset_id).then(setDataset).catch(() => setDataset(null));
  }, [report.dataset_id]);

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
      const updated = await publishDatasetReport(report.$id, session.userId, report.tenant_id);
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
        <h3 className="text-sm font-semibold text-ink">
          {dataset?.name ?? 'Dataset'} {dataset?.period_label ? `— ${dataset.period_label}` : ''}
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