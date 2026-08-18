import { createHash } from 'crypto';

export function hashVisitorToken(token: string): string {
  const salt = process.env.VISITOR_HASH_SALT ?? '';
  const raw = `${salt}:kb-contribution:${token}`;
  return createHash('sha256').update(raw).digest('hex');
}