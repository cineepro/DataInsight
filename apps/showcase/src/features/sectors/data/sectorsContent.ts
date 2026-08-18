//apps/showcase/src/features/sectors/data/sectorsContent.ts
export interface SectorContent {
  id: string;
  label: string;
  tagline: string;
  needs: string[];
  offers: { title: string; description: string }[];
  pitch: string;
}

export const SECTORS_CONTENT: SectorContent[] = [
  {
    id: 'restauration',
    label: 'Restauration',
    tagline: "Comprendre ce qui fait revenir vos clients, pas juste ce qu'ils commandent.",
    needs: [
      'Identifier les pics d\'affluence et les creux de service',
      'Savoir quels plats sont vraiment rentables',
      'Suivre les clients réguliers et détecter ceux qui s\'éloignent',
    ],
    offers: [
      { title: "Matrice de satisfaction du menu", description: "Croisez popularité et satisfaction pour chaque plat." },
      { title: "Détection des goulets d'étranglement", description: "Identifiez précisément les créneaux horaires à risque." },
      { title: "Suivi de fidélité", description: "Repérez les clients qui espacent leurs visites avant qu'ils ne disparaissent." },
    ],
    pitch:
      "Vous avez déjà de bons plats. Notre rôle est de vous montrer précisément lesquels fonctionnent, quand vos clients viennent, et lesquels risquent de ne plus revenir.",
  },
  {
    id: 'pharmacie',
    label: 'Pharmacie',
    tagline: 'La maîtrise du stock et la compréhension de votre patientèle, sans marketing agressif.',
    needs: [
      'Réduire le stock mort et anticiper les ruptures',
      'Anticiper les pics saisonniers (paludisme, grippe, allergies)',
      'Mesurer l\'efficacité des mises en avant produit',
    ],
    offers: [
      { title: 'Impact des ruptures de stock', description: 'Identifiez les produits les plus souvent signalés en rupture.' },
      { title: 'Efficacité file / effectif', description: "Corrélez temps d'attente et personnel en poste." },
      { title: 'Segmentation par motif de visite', description: 'Ordonnance, parapharmacie, conseil — comprenez chaque flux.' },
    ],
    pitch:
      "On ne va pas transformer votre pharmacie en magasin de luxe. On vous aide à mieux voir ce qui se passe réellement dans vos ventes, à anticiper les ruptures, et à comprendre votre patientèle régulière.",
  },
  {
    id: 'hotellerie',
    label: 'Hôtellerie',
    tagline: "Savoir d'où viennent vos clients, et lesquels reviennent.",
    needs: [
      'Comprendre les canaux de réservation réels (direct, plateformes, agences)',
      'Suivre le taux de réachat',
      'Cibler les périodes creuses avec précision',
    ],
    offers: [
      { title: "Origine des réservations", description: "Distinguez direct, plateformes et bouche-à-oreille." },
      { title: 'Taux de retour client', description: 'Détectez une baisse de fidélité avant qu\'elle ne soit visible sur le CA.' },
      { title: 'Analyse des périodes faibles', description: 'Ciblez vos actions commerciales sur les bons créneaux.' },
    ],
    pitch:
      "Notre rôle n'est pas de vous promettre de remplir l'hôtel du jour au lendemain. On vous aide à comprendre d'où viennent vos clients, lesquels reviennent, et quelles périodes nécessitent une action.",
  },
  {
    id: 'commerce',
    label: 'Commerce de détail',
    tagline: 'Protéger le flux de clients que vous avez déjà, avant d\'en chercher davantage.',
    needs: [
      'Savoir quels produits et rayons performent réellement',
      'Anticiper les ruptures sur les produits à rotation rapide',
      'Mesurer si vos promotions sont vraiment rentables',
    ],
    offers: [
      { title: 'Performance des rayons', description: 'Identifiez les produits qui tournent vite et ceux qui stagnent.' },
      { title: "Anticipation des ruptures", description: 'Réduisez la fréquence des ruptures sur vos produits sensibles.' },
      { title: "Mesure d'impact des promotions", description: 'Comparez ventes avant/après pour juger objectivement.' },
    ],
    pitch:
      "Vous avez déjà un bon flux de clients. Notre rôle n'est pas de vous en amener plus, mais de vous aider à le comprendre, à le protéger, et à le stabiliser.",
  },
];