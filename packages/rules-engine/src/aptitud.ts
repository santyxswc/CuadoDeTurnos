// RN-03 · Aptitud para tomar un turno (filtro de sobrecarga).

export type Clasificacion = 'APTO' | 'APTO_CON_ADVERTENCIA' | 'NO_APTO';

export interface Intervalo {
  inicio: Date;
  fin: Date;
}

export interface Candidato {
  activo: boolean;
  /** Asignaciones activas de la persona (sin incluir el turno evaluado). */
  asignaciones: Intervalo[];
  /** Vacaciones y permisos aprobados. */
  ausencias: Intervalo[];
}

export interface ParametrosAptitud {
  descansoMinimoH: number;
  maximaSemanalH: number;
  maxExtraSemanalH: number;
  umbralAlertaPct: number;
  maxNochesConsecutivas: number;
}

export interface ResultadoAptitud {
  clasificacion: Clasificacion;
  motivos: string[];
  /** Horas programadas en la semana del turno, incluyéndolo. */
  horasSemana: number;
}

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const OFFSET_BOGOTA = -5 * HORA;

const horas = (i: Intervalo) => (i.fin.getTime() - i.inicio.getTime()) / HORA;
const seSolapan = (a: Intervalo, b: Intervalo) => a.inicio < b.fin && b.inicio < a.fin;
const diaLocal = (d: Date) => Math.floor((d.getTime() + OFFSET_BOGOTA) / DIA);

/** Un turno es nocturno si empieza en un día local y termina en el siguiente. */
const esNoche = (i: Intervalo) => diaLocal(new Date(i.fin.getTime() - 1)) > diaLocal(i.inicio);

/** Lunes 00:00 local de la semana que contiene la fecha (1970-01-01 fue jueves). */
function inicioSemana(d: Date): number {
  const dia = diaLocal(d);
  const diaSemana = (dia + 3) % 7; // 0 = lunes
  return (dia - diaSemana) * DIA - OFFSET_BOGOTA;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function evaluarAptitud(c: Candidato, turno: Intervalo, p: ParametrosAptitud): ResultadoAptitud {
  const noApto: string[] = [];
  const advertencias: string[] = [];

  const semanaIni = inicioSemana(turno.inicio);
  const semanaFin = semanaIni + 7 * DIA;
  const horasSemana =
    c.asignaciones
      .filter((a) => a.inicio.getTime() >= semanaIni && a.inicio.getTime() < semanaFin)
      .reduce((s, a) => s + horas(a), 0) + horas(turno);

  if (!c.activo) noApto.push('Usuario inactivo');

  if (c.asignaciones.some((a) => seSolapan(a, turno))) noApto.push('Tiene otra asignación que se cruza');

  if (c.ausencias.some((a) => seSolapan(a, turno))) noApto.push('Está en vacaciones o permiso');

  const anterior = c.asignaciones
    .filter((a) => a.fin <= turno.inicio)
    .sort((a, b) => b.fin.getTime() - a.fin.getTime())[0];
  if (anterior) {
    const descanso = (turno.inicio.getTime() - anterior.fin.getTime()) / HORA;
    if (descanso < p.descansoMinimoH)
      noApto.push(`Descanso de ${fmt(descanso)} h antes del turno < ${p.descansoMinimoH} h mínimo`);
  }
  const siguiente = c.asignaciones
    .filter((a) => a.inicio >= turno.fin)
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())[0];
  if (siguiente) {
    const descanso = (siguiente.inicio.getTime() - turno.fin.getTime()) / HORA;
    if (descanso < p.descansoMinimoH)
      noApto.push(`Descanso de ${fmt(descanso)} h después del turno < ${p.descansoMinimoH} h mínimo`);
  }

  const limite = p.maximaSemanalH + p.maxExtraSemanalH;
  if (horasSemana > limite) {
    noApto.push(`Quedaría con ${fmt(horasSemana)} h en la semana (límite ${limite} h)`);
  } else if (horasSemana > p.maximaSemanalH) {
    advertencias.push(`Generaría ${fmt(horasSemana - p.maximaSemanalH)} h de exceso en la semana`);
  } else if (horasSemana > (p.maximaSemanalH * p.umbralAlertaPct) / 100) {
    advertencias.push(`Quedaría con ${fmt(horasSemana)} h, cerca del máximo de ${p.maximaSemanalH} h`);
  }

  if (esNoche(turno)) {
    const noches = new Set(c.asignaciones.filter(esNoche).map((a) => diaLocal(a.inicio)));
    const dia = diaLocal(turno.inicio);
    let seguidas = 1;
    for (let d = dia - 1; noches.has(d); d--) seguidas++;
    for (let d = dia + 1; noches.has(d); d++) seguidas++;
    if (seguidas > p.maxNochesConsecutivas)
      noApto.push(`Serían ${seguidas} noches seguidas (máximo ${p.maxNochesConsecutivas})`);
  }

  if (noApto.length) return { clasificacion: 'NO_APTO', motivos: noApto, horasSemana };
  if (advertencias.length) return { clasificacion: 'APTO_CON_ADVERTENCIA', motivos: advertencias, horasSemana };
  return { clasificacion: 'APTO', motivos: [], horasSemana };
}
