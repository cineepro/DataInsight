//appwrite/functions/ask-ai-lab/src/hashVisitor.ts
import { createHash } from 'crypto';

export function hashVisitorToken(token: string): string {
  const salt = process.env.VISITOR_HASH_SALT ?? '';
  const raw = `${salt}:ai-lab:${token}`;
  return createHash('sha256').update(raw).digest('hex');
}