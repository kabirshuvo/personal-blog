import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { compare, hash } from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  if (passwordHash.startsWith('scrypt:')) {
    const [, salt, storedHash] = passwordHash.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const derived = scryptSync(password, salt, 64).toString('hex');

    try {
      return timingSafeEqual(
        Buffer.from(storedHash, 'hex'),
        Buffer.from(derived, 'hex'),
      );
    } catch {
      return false;
    }
  }

  return compare(password, passwordHash);
}

export function createRandomToken(): string {
  return randomBytes(32).toString('hex');
}
