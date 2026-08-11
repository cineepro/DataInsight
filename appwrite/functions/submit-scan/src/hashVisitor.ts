//appwrite/functions/submit-scan/src/hashVisitor.ts
import { createHash } from 'crypto';

/**
 * Transforme (IP + tenant + user-agent) en une empreinte irréversible.
 * L'IP en clair n'est JAMAIS stockée, ni ici ni ailleurs dans le système.
 * Un "sel" (VISITOR_HASH_SALT) empêche quiconque de reconstituer l'IP
 * même en connaissant l'algorithme, tant que le sel reste secret.
 */
export function hashVisitor(ip: string, tenantId: string, userAgent: string): string {
  const salt = process.env.VISITOR_HASH_SALT ?? '';
  const raw = `${salt}:${ip}:${tenantId}:${userAgent}`;
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Récupère l'IP réelle du visiteur depuis les en-têtes de la requête.
 * Appwrite transmet généralement l'IP via x-forwarded-for derrière son proxy.
 */
export function extractClientIp(headers: Record<string, string>): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers['x-real-ip'] ?? 'unknown';
}