// Adaptador entre los datos del prototipo y el motor de reglas compartido (@sgt/rules-engine).
// En la versión final estos parámetros vienen de la API (tabla PARAMETRO con vigencias).
import {
  aHoras,
  calcularMinutos,
  evaluarAptitud,
  horaAMinutos,
  type DesgloseMinutos,
  type OpcionesCalculoHoras,
  type ResultadoAptitud,
} from '@sgt/rules-engine';
import { PARAMETROS_DEFECTO as P } from '@sgt/shared-types';
import { lunesDe, sumarDias } from './fechas';
import { FESTIVOS, type Asignacion, type Solicitud } from './mock';
import { bog } from './fechas';

export const OPCIONES_HORAS: OpcionesCalculoHoras = {
  franjaNocturna: () => ({
    inicioMin: horaAMinutos(P['jornada.inicio_nocturna']),
    finMin: horaAMinutos(P['jornada.fin_nocturna']),
  }),
  esFestivo: (fecha) => fecha in FESTIVOS,
};

export const PARAMETROS_APTITUD = {
  descansoMinimoH: P['aptitud.descanso_minimo_h'],
  maximaSemanalH: P['jornada.maxima_semanal_h'],
  maxExtraSemanalH: P['extra.max_semanales_h'],
  umbralAlertaPct: P['aptitud.umbral_alerta_pct'],
  maxNochesConsecutivas: P['aptitud.max_noches_consecutivas'],
};

export const PARAMETROS_ASISTENCIA = {
  toleranciaRetrasoMin: P['asistencia.tolerancia_retraso_min'],
  minutosAusente: P['asistencia.minutos_ausente'],
  alertaSalidaMin: P['asistencia.alerta_salida_min'],
};

export const PORCENTAJES_RECARGO = {
  nocturnoPct: P['recargo.nocturno_pct'],
  extraDiurnaPct: P['recargo.extra_diurna_pct'],
  extraNocturnaPct: P['recargo.extra_nocturna_pct'],
  dominicalPct: P['recargo.dominical_pct'],
};

export const desgloseHoras = (inicio: Date, fin: Date): DesgloseMinutos =>
  aHoras(calcularMinutos(inicio, fin, OPCIONES_HORAS));

export const duracionH = (a: { inicio: Date; fin: Date }) => (a.fin.getTime() - a.inicio.getTime()) / 3_600_000;

/** Vacaciones y permisos aprobados de una persona, como intervalos. */
export function ausenciasDe(usuarioId: string, solicitudes: Solicitud[]) {
  return solicitudes
    .filter((s) => s.solicitanteId === usuarioId && s.estado === 'APLICADA' && (s.tipo === 'VACACIONES' || s.tipo === 'PERMISO') && s.desde && s.hasta)
    .map((s) => ({ inicio: bog(`${s.desde}T00:00`), fin: bog(`${sumarDias(s.hasta!, 1)}T00:00`) }));
}

/** Evalúa si una persona puede tomar un turno dado, con sus demás asignaciones activas. */
export function aptitudPara(
  usuarioId: string,
  turno: { inicio: Date; fin: Date },
  asignaciones: Asignacion[],
  solicitudes: Solicitud[],
  excluirIds: string[] = [],
): ResultadoAptitud {
  const propias = asignaciones.filter(
    (a) => a.usuarioId === usuarioId && a.estado === 'ACTIVA' && !excluirIds.includes(a.id),
  );
  return evaluarAptitud({ activo: true, asignaciones: propias, ausencias: ausenciasDe(usuarioId, solicitudes) }, turno, PARAMETROS_APTITUD);
}

/** Horas programadas por semana (lunes a domingo) de una persona. */
export function horasPorSemana(usuarioId: string, asignaciones: Asignacion[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const a of asignaciones) {
    if (a.usuarioId !== usuarioId || a.estado !== 'ACTIVA') continue;
    const lunes = lunesDe(a.fecha);
    r[lunes] = (r[lunes] ?? 0) + duracionH(a);
  }
  return r;
}
