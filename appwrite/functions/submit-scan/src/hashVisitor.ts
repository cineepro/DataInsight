//appwrite/functions/submit-scan/src/hashVisitor.ts
import { createHash } from 'crypto';

/**
 * Transforme (IP + tenant + user-agent) en une empreinte irréversible.
 * L'IP en clair n'est JAMAIS stockée, ni ici ni ailleurs dans le système.
 * Signal de repli uniquement — voir hashVisitorToken pour le signal principal.
 */
export function hashVisitor(ip: string, tenantId: string, userAgent: string): string {
  const salt = process.env.VISITOR_HASH_SALT ?? '';
  const raw = `${salt}:${ip}:${tenantId}:${userAgent}`;
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Hash du jeton d'appareil généré côté navigateur (localStorage). Signal
 * PRINCIPAL de reconnaissance d'un visiteur — bien plus fiable que
 * hashVisitor() seul, qui collisionne facilement (IP partagée sur réseaux
 * mobiles africains, user-agent Chrome uniformisé entre téléphones).
 */
export function hashVisitorToken(token: string, tenantId: string): string {
  const salt = process.env.VISITOR_HASH_SALT ?? '';
  const raw = `${salt}:token:${tenantId}:${token}`;
  return createHash('sha256').update(raw).digest('hex');
}

export function extractClientIp(headers: Record<string, string>): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers['x-real-ip'] ?? 'unknown';
}