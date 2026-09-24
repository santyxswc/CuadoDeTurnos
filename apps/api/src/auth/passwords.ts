import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes, randomInt } from 'node:crypto';

// Argon2id con los parámetros recomendados por OWASP (19 MiB, 2 iteraciones).
export const hashPassword = (password: string) => hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });

export async function verificarPassword(hashGuardado: string, password: string): Promise<boolean> {
  try {
    return await verify(hashGuardado, password);
  } catch {
    return false;
  }
}

/** Sin caracteres que se confunden al dictarla (0/O, 1/l/I). */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generarPasswordTemporal(): string {
  let p = '';
  while (!cumplePolitica(p)) {
    p = Array.from({ length: 10 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
  }
  return p;
}

/** Mínimo 8 caracteres, con al menos una letra y un número. */
export function cumplePolitica(p: string): boolean {
  return p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
}

export const MENSAJE_POLITICA = 'La contraseña debe tener al menos 8 caracteres, con letras y números.';

export const tokenAleatorio = () => randomBytes(32).toString('base64url');
export const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex');
