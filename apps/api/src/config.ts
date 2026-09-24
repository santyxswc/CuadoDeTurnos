import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

export interface ConfigSgt {
  /** Carpeta donde viven los archivos JSON (ADR-010). */
  directorioDatos: string;
  secretoJwt: string;
  /** Vida del token de acceso. */
  minutosTokenAcceso: number;
  /** Duración máxima de una sesión aunque haya actividad. */
  horasMaximasSesion: number;
  /** Documento y contraseña del primer coordinador (solo si no hay usuarios). */
  documentoAdmin: string;
  passwordAdmin?: string;
}

export const CONFIG = Symbol('CONFIG');

export function configDesdeEntorno(): ConfigSgt {
  let secretoJwt = process.env.SGT_JWT_SECRET;
  if (!secretoJwt) {
    secretoJwt = randomBytes(32).toString('hex');
    console.warn('⚠ SGT_JWT_SECRET no está definido: se generó uno temporal y las sesiones se cerrarán al reiniciar la API.');
  }
  return {
    directorioDatos: resolve(process.env.SGT_DATA_DIR ?? './datos'),
    secretoJwt,
    minutosTokenAcceso: 10,
    horasMaximasSesion: 12,
    documentoAdmin: process.env.SGT_ADMIN_DOCUMENTO ?? 'admin',
    passwordAdmin: process.env.SGT_ADMIN_PASSWORD,
  };
}
