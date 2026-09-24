import { Injectable } from '@nestjs/common';
import type { EventoAuditoriaDto } from '@sgt/shared-types';
import { AlmacenService } from '../almacen/almacen.service';

/** Campos que nunca se escriben en la auditoría. */
const CAMPOS_SECRETOS = new Set(['hashPassword', 'hashRefresco', 'password', 'passwordTemporal']);

function limpiar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(limpiar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).filter(([k]) => !CAMPOS_SECRETOS.has(k)).map(([k, v]) => [k, limpiar(v)]),
    );
  }
  return valor;
}

export interface NuevoEvento {
  actorId: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  antes?: unknown;
  despues?: unknown;
}

/** Registro inmutable de acciones sensibles (RF-ADM-03, RNF-06). */
@Injectable()
export class AuditoriaService {
  constructor(private readonly almacen: AlmacenService) {}

  registrar(e: NuevoEvento): Promise<void> {
    return this.almacen.auditoria.agregar({
      fecha: new Date().toISOString(),
      actorId: e.actorId,
      accion: e.accion,
      entidad: e.entidad,
      entidadId: e.entidadId ?? null,
      ...(e.antes !== undefined && { antes: limpiar(e.antes) }),
      ...(e.despues !== undefined && { despues: limpiar(e.despues) }),
    });
  }

  async ultimos(limite: number): Promise<EventoAuditoriaDto[]> {
    const eventos = await this.almacen.auditoria.ultimos(limite);
    return eventos.map((e) => ({ ...e, actorNombre: e.actorId ? (this.almacen.usuarios.obtener(e.actorId)?.nombres ?? null) : null }));
  }
}
