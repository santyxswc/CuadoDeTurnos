// RN-04 · Vacaciones: 15 días hábiles por año de servicio (CST art. 186).
import { PARAMETROS_DEFECTO as P } from '@sgt/shared-types';
import { AHORA, FESTIVOS, type Persona, type Solicitud } from './mock';
import { diaSemana, fechaLocal, rangoFechas, sumarDias } from './fechas';

/** Día hábil por defecto: lunes a sábado sin festivos (parámetro a confirmar con el cliente). */
export const esHabil = (fecha: string) => diaSemana(fecha) !== 0 && !(fecha in FESTIVOS);

export const diasHabiles = (desde: string, hasta: string) => rangoFechas(desde, hasta).filter(esHabil).length;

export function fechaReintegro(hasta: string): string {
  let f = sumarDias(hasta, 1);
  while (!esHabil(f)) f = sumarDias(f, 1);
  return f;
}

function aniosCumplidos(desde: string, hasta: string): number {
  const [a1, m1, d1] = desde.split('-').map(Number);
  const [a2, m2, d2] = hasta.split('-').map(Number);
  return a2 - a1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0);
}

export interface SaldoVacaciones {
  aniosServicio: number;
  diasCausados: number;
  /** Proporción causada del año en curso (informativa). */
  causacionProporcional: number;
  diasDisfrutados: number;
  diasAprobadosPorDisfrutar: number;
  disponibles: number;
  puedeSolicitarDesde: string;
  alertaAcumulacion: boolean;
}

export function saldoVacaciones(p: Persona, solicitudes: Solicitud[]): SaldoVacaciones {
  const hoy = fechaLocal(AHORA);
  const anios = aniosCumplidos(p.fechaIngreso, hoy);
  const ultimoAniversario = `${Number(p.fechaIngreso.slice(0, 4)) + anios}${p.fechaIngreso.slice(4)}`;
  const diasDesdeAniversario = (Date.parse(hoy) - Date.parse(ultimoAniversario)) / 86_400_000;
  const porAnio = P['vacaciones.dias_por_anio'];

  const aprobadas = solicitudes
    .filter((s) => s.solicitanteId === p.id && s.tipo === 'VACACIONES' && s.estado === 'APLICADA' && s.desde && s.hasta)
    .reduce((t, s) => t + diasHabiles(s.desde!, s.hasta!), 0);

  const diasCausados = anios * porAnio;
  const disponibles = diasCausados - p.diasDisfrutados - aprobadas;
  return {
    aniosServicio: anios,
    diasCausados,
    causacionProporcional: Math.max(0, (porAnio * diasDesdeAniversario) / 365),
    diasDisfrutados: p.diasDisfrutados,
    diasAprobadosPorDisfrutar: aprobadas,
    disponibles,
    puedeSolicitarDesde: anios >= 1 ? hoy : `${Number(p.fechaIngreso.slice(0, 4)) + 1}${p.fechaIngreso.slice(4)}`,
    // RF-VAC-07: más de un periodo sin disfrutar → la ley exige concederlas dentro del año siguiente.
    alertaAcumulacion: disponibles > porAnio,
  };
}
