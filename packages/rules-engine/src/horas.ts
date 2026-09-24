// RN-01 · Segmentación de un intervalo de trabajo en horas diurnas/nocturnas
// y ordinarias/dominicales. Todo se trabaja en minutos para evitar errores de redondeo;
// solo se redondea al presentar.

/** Colombia no tiene horario de verano: America/Bogota es siempre UTC-5. */
const OFFSET_BOGOTA_MS = -5 * 60 * 60 * 1000;
const MINUTO_MS = 60 * 1000;
const DIA_MS = 24 * 60 * MINUTO_MS;

/** Franja nocturna vigente en una fecha, en minutos desde la medianoche local. */
export interface FranjaNocturna {
  /** Ej. 19:00 → 1140. */
  inicioMin: number;
  /** Ej. 06:00 → 360. */
  finMin: number;
}

export interface OpcionesCalculoHoras {
  /** Devuelve la franja vigente para una fecha local "YYYY-MM-DD" (parámetros con vigencia, ADR-004). */
  franjaNocturna: (fechaLocal: string) => FranjaNocturna;
  /** Indica si una fecha local "YYYY-MM-DD" es festivo. */
  esFestivo: (fechaLocal: string) => boolean;
}

export interface DesgloseMinutos {
  diurnasOrdinarias: number;
  nocturnasOrdinarias: number;
  diurnasDominicales: number;
  nocturnasDominicales: number;
}

export function horaAMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fechaLocalDeDia(diaLocal: number): string {
  return new Date(diaLocal * DIA_MS).toISOString().slice(0, 10);
}

function esDomingo(diaLocal: number): boolean {
  return new Date(diaLocal * DIA_MS).getUTCDay() === 0;
}

/**
 * Parte el intervalo [inicio, fin) en los cortes de 00:00, fin de nocturna e inicio de nocturna
 * de cada día local, y suma los minutos de cada segmento según su franja y tipo de día.
 * El tipo de día (ordinario/dominical-festivo) y la franja se toman de la fecha a la que
 * pertenece cada segmento, con los parámetros vigentes en esa fecha.
 */
export function calcularMinutos(inicio: Date, fin: Date, opciones: OpcionesCalculoHoras): DesgloseMinutos {
  const desglose: DesgloseMinutos = {
    diurnasOrdinarias: 0,
    nocturnasOrdinarias: 0,
    diurnasDominicales: 0,
    nocturnasDominicales: 0,
  };
  if (fin.getTime() <= inicio.getTime()) return desglose;

  // "Tiempo local" representado como milisegundos UTC desplazados.
  let cursor = inicio.getTime() + OFFSET_BOGOTA_MS;
  const limite = fin.getTime() + OFFSET_BOGOTA_MS;

  while (cursor < limite) {
    const dia = Math.floor(cursor / DIA_MS);
    const inicioDia = dia * DIA_MS;
    const fecha = fechaLocalDeDia(dia);
    const franja = opciones.franjaNocturna(fecha);
    const dominical = esDomingo(dia) || opciones.esFestivo(fecha);

    const cortes = [franja.finMin * MINUTO_MS, franja.inicioMin * MINUTO_MS, DIA_MS]
      .map((c) => inicioDia + c)
      .filter((c) => c > cursor);
    const siguiente = Math.min(limite, ...cortes);

    const minutoDelDia = (cursor - inicioDia) / MINUTO_MS;
    const nocturna = minutoDelDia < franja.finMin || minutoDelDia >= franja.inicioMin;
    const minutos = (siguiente - cursor) / MINUTO_MS;

    if (dominical) {
      if (nocturna) desglose.nocturnasDominicales += minutos;
      else desglose.diurnasDominicales += minutos;
    } else if (nocturna) {
      desglose.nocturnasOrdinarias += minutos;
    } else {
      desglose.diurnasOrdinarias += minutos;
    }
    cursor = siguiente;
  }
  return desglose;
}

/** Convierte un desglose en minutos a horas (decimales), para presentar. */
export function aHoras(d: DesgloseMinutos): DesgloseMinutos {
  return {
    diurnasOrdinarias: d.diurnasOrdinarias / 60,
    nocturnasOrdinarias: d.nocturnasOrdinarias / 60,
    diurnasDominicales: d.diurnasDominicales / 60,
    nocturnasDominicales: d.nocturnasDominicales / 60,
  };
}
