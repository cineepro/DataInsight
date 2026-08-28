//apps/studio/src/engine/types.ts
// Ce fichier ne fait plus que ré-exporter le package partagé — la vraie
// définition vit maintenant dans @datainsight/engine, réutilisable aussi
// côté serveur (Appwrite Functions) pour l'API publique.
export type {
  AnalysisResult,
  AnalysisFunctionContext,
  AnalysisFunction,
  AnalysisFunctionDescriptor,
} from '@datainsight/engine';