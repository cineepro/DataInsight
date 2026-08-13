//apps/collect/src/utils/visitorToken.ts
const STORAGE_KEY = 'di_visitor_token';

/**
 * Génère (une seule fois par appareil/navigateur) un identifiant aléatoire
 * stocké en local, jamais transmis ailleurs qu'à notre propre backend.
 * Ce n'est PAS un identifiant publicitaire ni un fingerprint dérivé du
 * matériel — juste un UUID aléatoire, donc il ne révèle rien sur la
 * personne. Il permet simplement de reconnaître "le même téléphone revient"
 * de façon bien plus fiable que IP+user-agent, qui se sont révélés
 * collisionner facilement (réseaux mobiles partagés, Chrome UA uniformisé).
 */
export function getOrCreateVisitorToken(): string | null {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const token = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    // Navigation privée ou stockage bloqué : on retombe sur le hash IP+UA
    // côté serveur, moins fiable mais toujours fonctionnel.
    return null;
  }
}