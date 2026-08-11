// apps/client-dashboard/src/features/reports/components/DownloadPdfButton.tsx
import Button from '../../../components/ui/Button';

interface DownloadPdfButtonProps {
  targetId: string;
}

export default function DownloadPdfButton({ targetId }: DownloadPdfButtonProps) {
  function handlePrint() {
    document.querySelectorAll('.report-card').forEach((el) => {
      if (el.id !== targetId) el.classList.add('no-print');
    });
    window.print();
    document.querySelectorAll('.report-card').forEach((el) => el.classList.remove('no-print'));
  }

  return (
    <Button variant="secondary" onClick={handlePrint} className="no-print">
      Télécharger en PDF
    </Button>
  );
}