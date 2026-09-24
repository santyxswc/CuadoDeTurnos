// Clasificación de horas del período para el reporte de horas y el valor estimado de recargos (RF-HOR-07).
import type { HorasClasificadas } from '@sgt/rules-engine';
import { PARAMETROS_DEFECTO as P } from '@sgt/shared-types';
import type { Asignacion, Marcacion } from './mock';
import { lunesDe } from './fechas';
import { desgloseHoras } from './reglas';

export type Fuente = 'reales' | 'programadas';

export interface FilaHoras {
  a: Asignacion;
  inicio: Date;
  fin: Date;
  total: number;
  diurnas: number;
  nocturnas: number;
  dominicalesDiurnas: number;
  dominicalesNocturnas: number;
  /** Horas de esta fila que se pagan como extra por superar la jornada semanal. */
  extra: number;
}

export function filasHoras(usuarioId: string, asignaciones: Asignacion[], marcaciones: Record<string, Marcacion>, fuente: Fuente): FilaHoras[] {
  const filas: FilaHoras[] = [];
  for (const a of asignaciones) {
    if (a.usuarioId !== usuarioId || a.estado !== 'ACTIVA') continue;
    const m = marcaciones[a.id];
    // Respuesta 5 del cliente: las horas oficiales son las marcadas.
    const [inicio, fin] = fuente === 'reales' ? [m?.entrada, m?.salida] : [a.inicio, a.fin];
    if (!inicio || !fin) continue;
    const d = desgloseHoras(inicio, fin);
    filas.push({
      a, inicio, fin,
      total: d.diurnasOrdinarias + d.nocturnasOrdinarias + d.diurnasDominicales + d.nocturnasDominicales,
      diurnas: d.diurnasOrdinarias,
      nocturnas: d.nocturnasOrdinarias,
      dominicalesDiurnas: d.diurnasDominicales,
      dominicalesNocturnas: d.nocturnasDominicales,
      extra: 0,
    });
  }
  filas.sort((x, y) => x.inicio.getTime() - y.inicio.getTime());

  // RN-02: lo que pasa de la jornada máxima semanal es exceso. Se toma de los últimos turnos de la semana.
  const semanas = new Map<string, FilaHoras[]>();
  for (const f of filas) semanas.set(lunesDe(f.a.fecha), [...(semanas.get(lunesDe(f.a.fecha)) ?? []), f]);
  for (const lista of semanas.values()) {
    let restante = lista.reduce((s, f) => s + f.total, 0) - P['jornada.maxima_semanal_h'];
    for (const f of [...lista].reverse()) {
      if (restante <= 0) break;
      f.extra = Math.min(restante, f.total);
      restante -= f.extra;
    }
  }
  return filas;
}

/**
 * Agrupa las filas en los conceptos de la tabla de recargos. La parte extra de cada turno se reparte
 * proporcionalmente entre sus franjas (estimación preliminar, a validar con nómina).
 */
export function clasificar(filas: FilaHoras[]): HorasClasificadas {
  const h: HorasClasificadas = {
    nocturnasOrdinarias: 0, diurnasDominicales: 0, nocturnasDominicales: 0,
    extraDiurnas: 0, extraNocturnas: 0, extraDiurnasDominicales: 0, extraNocturnasDominicales: 0,
  };
  for (const f of filas) {
    const pe = f.total ? f.extra / f.total : 0;
    h.nocturnasOrdinarias += f.nocturnas * (1 - pe);
    h.diurnasDominicales += f.dominicalesDiurnas * (1 - pe);
    h.nocturnasDominicales += f.dominicalesNocturnas * (1 - pe);
    h.extraDiurnas += f.diurnas * pe;
    h.extraNocturnas += f.nocturnas * pe;
    h.extraDiurnasDominicales += f.dominicalesDiurnas * pe;
    h.extraNocturnasDominicales += f.dominicalesNocturnas * pe;
  }
  return h;
}
