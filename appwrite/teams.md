# Teams Appwrite — ASILLIA DataInsight

## admins
Accès total au studio : gestion des structures (tenants), lancement des
analyses, édition et publication des rapports, gestion des abonnements.
Toi (Emile) en fais partie dès la création du projet.

## analysts
Accès au studio pour lancer les analyses et éditer les directives
(features/studio, features/reports), mais SANS accès à la gestion des
tenants ni aux paramètres d'abonnement (features/tenants réservé aux admins
au niveau du routing front-end — voir AppRouter.tsx).
Ex: Eustache (Data Analyst).

## Création manuelle (aucune inscription libre)
1. Console Appwrite → Auth → Users → "Create user" (email + mot de passe
   temporaire, à transmettre à la personne).
2. Console Appwrite → Auth → Teams → créer "admins" et "analysts" si pas
   déjà fait.
3. Ouvrir la Team concernée → "Add member" → sélectionner l'utilisateur créé.
4. Aucune route de "sign up" n'existe dans apps/studio — la seule façon
   d'obtenir un accès est d'être ajouté manuellement à une Team par un admin.