# Permissions Appwrite — ASILLIA DataInsight

Résumé des règles appliquées au niveau de chaque collection
(Console → Databases → [collection] → Settings → Permissions).

| Collection             | create              | read                          | update/delete       |
|-------------------------|---------------------|--------------------------------|----------------------|
| tenants                 | team:admins         | team:admins (public via Function) | team:admins       |
| scans_restaurant        | any (role:all)      | team:admins, team:analysts    | team:admins, team:analysts |
| scans_pharmacie         | any (role:all)      | team:admins, team:analysts    | team:admins, team:analysts |
| scans_entreprise        | any (role:all)      | team:admins, team:analysts    | team:admins, team:analysts |
| operational_metrics     | team:admins, team:analysts | team:admins, team:analysts | team:admins, team:analysts |
| weekly_reports          | team:admins, team:analysts | team:admins (+ tenant en v2) | team:admins, team:analysts |

## Règle d'or
Le SEUL point d'ouverture publique volontaire = `create` sur les 3
collections `scans_*`. C'est ce qui permet au client final de soumettre
son avis sans compte. Aucune autre opération n'est publique.

## Permissions au niveau document vs collection
Les règles ci-dessus sont posées au niveau COLLECTION (s'appliquent à tous
les documents créés via le SDK client standard). Les Appwrite Functions,
elles, utilisent une clé API serveur qui **bypass ces permissions** —
c'est pourquoi le contrôle d'accès pour ces Functions se fait via leurs
propres "Execute permissions" (voir permissions par Function ci-dessous)
et non via les permissions de collection.

## Execute permissions par Function

| Function                     | Qui peut l'exécuter |
|-------------------------------|----------------------|
| get-tenant-public-info        | any (role:all) — appelée par apps/collect sans session |
| submit-scan                   | any (role:all) — idem, optionnel v2 |
| compute-week-number           | aucune (déclenchée par cron uniquement, pas d'exécution manuelle publique) |
| run-claude-analysis           | team:admins, team:analysts — appelée uniquement depuis apps/studio authentifié |
| publish-weekly-report         | team:admins, team:analysts |