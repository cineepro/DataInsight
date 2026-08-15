// apps/ai-lab/src/utils/visitorToken.ts
const STORAGE_KEY = 'ai_lab_visitor_token';

export function getOrCreateVisitorToken(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    // Repli si le stockage est bloqué : un token éphémère, généré à
    // chaque question — le rate-limit fonctionnera moins finement dans
    // ce cas précis, mais le chat reste utilisable.
    return crypto.randomUUID();
  }
}