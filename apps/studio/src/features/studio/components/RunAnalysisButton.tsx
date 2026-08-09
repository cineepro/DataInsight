//apps/studio/src/features/studio/components/RunAnalysisButton.tsx
import Button from '../../../components/ui/Button';

interface RunAnalysisButtonProps {
  disabled: boolean;
  loading: boolean;
  onRun: () => void;
}

// Étape 4 : déclenche l'exécution des fonctions sélectionnées puis
// l'appel à l'IA. La logique elle-même vit dans StudioPage (orchestration),
// ce composant ne gère que l'affichage du bouton.
export default function RunAnalysisButton({ disabled, loading, onRun }: RunAnalysisButtonProps) {
  return (
    <Button onClick={onRun} disabled={disabled} loading={loading} className="w-full">
      4. Lancer le traitement
    </Button>
  );
}