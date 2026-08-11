// apps/client-dashboard/src/features/reports/components/DownloadPdfButton.tsx
import Button from '../../../components/ui/Button';

interface DownloadPdfButtonProps {
  targetId: string;
}

/**
 * Solution volontairement simple, sans dépendance : déclenche l'impression
 * navigateur sur la seule carte concernée (le reste de la page est masqué
 * via la classe .no-print), que l'utilisateur peut "Enregistrer en PDF"
 * depuis la boîte de dialogue d'impression — fonctionne sur tous les
 * navigateurs mobiles et desktop sans librairie supplémentaire.
 */
export default function DownloadPdfButton({ targetId }: DownloadPdfButtonProps) {
  function handlePrint() {
    document.querySelectorAll('.report-card').forEach((el) => {
      if (el.id !== targetId) el.classList.add('no-print');
    });
    window.print();
    document.querySelectorAll('.report-card').forEach((el) => el.classList.remove('no-print'));
  }

  return (
    <Button onClick={handlePrint} className="no-print">
      Télécharger en PDF
    </Button>
  );
}