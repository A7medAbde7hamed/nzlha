import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getYouTubeEncryptionKey } from '@/lib/integrations/youtube';

export function encryptRefreshToken(token: string): string {
  const key = getYouTubeEncryptionKey();
  if (!key) throw new Error('Token encryption is not configured.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function decryptRefreshToken(encrypted: string): string {
  const key = getYouTubeEncryptionKey();
  if (!key) throw new Error('Token encryption is not configured.');
  const [version, ivValue, tagValue, ciphertextValue, extra] = encrypted.split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !ciphertextValue || extra) throw new Error('Stored token has an invalid format.');
  const iv = Buffer.from(ivValue, 'base64url');
  const tag = Buffer.from(tagValue, 'base64url');
  const ciphertext = Buffer.from(ciphertextValue, 'base64url');
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length < 1) throw new Error('Stored token has an invalid format.');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
