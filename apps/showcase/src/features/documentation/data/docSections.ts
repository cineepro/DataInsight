//apps/showcase/src/features/documentation/data/docSections.ts
export interface DocSection {
  id: string;
  title: string;
  content: string[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'collecte',
    title: "L'espace de collecte",
    content: [
      "Aucune inscription n'est nécessaire. Le client scanne le QR Code affiché sur place avec l'appareil photo de son téléphone.",
      "Le scan ouvre directement une page web légère. Le nom et le logo de l'établissement s'affichent automatiquement.",
      "Le client répond à quelques questions rapides adaptées à la catégorie de la structure, puis peut, s'il le souhaite, laisser son nom et son numéro — cette étape reste entièrement facultative.",
    ],
  },
  {
    id: 'analyse',
    title: "Le traitement et l'analyse",
    content: [
      "Chaque semaine, les données collectées sont analysées via des fonctions dédiées à chaque secteur (restaurant, pharmacie, commerce).",
      "L'intelligence artificielle transforme les résultats chiffrés en directives concrètes, rédigées en langage clair.",
      "Aucune analyse n'est publiée sans relecture humaine — un analyste valide et ajuste chaque rapport avant qu'il ne soit visible.",
    ],
  },
  {
    id: 'restitution',
    title: 'Votre espace personnel',
    content: [
      "Chaque structure partenaire dispose d'un accès sécurisé et personnel, où consulter tous ses rapports hebdomadaires.",
      "Un espace Statistiques complète les rapports avec des graphiques visuels, sur des blocs de 4 semaines consultables librement.",
      "Si vous nous transmettez directement vos propres données (fichiers Excel/CSV), nous les analysons de la même façon, avec les mêmes standards de rigueur.",
    ],
  },
  {
    id: 'confidentialite',
    title: 'Confidentialité des données',
    content: [
      "Aucune adresse IP n'est stockée en clair dans le système, à aucun moment.",
      "Chaque structure partenaire n'a accès qu'à ses propres données, jamais à celles des autres.",
      "Les comparaisons sectorielles affichées sont toujours anonymisées et agrégées sur plusieurs structures — jamais nominatives.",
    ],
  },
];