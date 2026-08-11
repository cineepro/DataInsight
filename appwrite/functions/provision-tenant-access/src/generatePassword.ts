//appwrite/functions/provision-tenant-access/src/generatePassword.ts
import { randomBytes } from 'crypto';

/**
 * Génère un mot de passe temporaire lisible (évite les caractères ambigus
 * type 0/O, l/1) à transmettre au gérant lors de la première connexion.
 */
export function generateTempPassword(length = 12): string {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}