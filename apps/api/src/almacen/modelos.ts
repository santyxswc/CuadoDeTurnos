// Forma de los documentos guardados en cada archivo JSON de la carpeta de datos.
import type { Cargo, Rol, SalarioDto, ValorParametro } from '@sgt/shared-types';

export interface UsuarioGuardado {
  id: string;
  documento: string;
  nombres: string;
  /** En minúsculas. */
  email: string | null;
  rol: Rol;
  cargo: Cargo;
  fechaIngreso: string;
  activo: boolean;
  /** Argon2id. Nunca sale de la API. */
  hashPassword: string;
  debeCambiarPassword: boolean;
  salarios: SalarioDto[];
  creadoEn: string;
}

export interface SesionGuardada {
  id: string;
  usuarioId: string;
  /** SHA-256 del token de refresco; el token en claro solo lo tiene el cliente. */
  hashRefresco: string;
  equipo: string | null;
  creadaEn: string;
  ultimoUso: string;
  expiraEn: string;
  revocadaEn: string | null;
}

export interface TipoTurnoGuardado {
  id: string;
  codigo: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  color: string;
  activo: boolean;
}

export interface ParametroGuardado {
  /** `${clave}@${vigenteDesde}` */
  id: string;
  clave: string;
  valor: ValorParametro;
  vigenteDesde: string;
  vigenteHasta: string | null;
}

export interface FestivoGuardado {
  /** Igual a la fecha. */
  id: string;
  fecha: string;
  nombre: string;
}

export interface EventoAuditoria {
  fecha: string;
  actorId: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  antes?: unknown;
  despues?: unknown;
}
