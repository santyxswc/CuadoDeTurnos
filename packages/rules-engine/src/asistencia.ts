// RF-ASI-03 / RF-MAIN-02 · Estado del turno de una persona en un instante dado.

export type EstadoTurno = 'PROGRAMADO' | 'EN_TURNO' | 'RETRASADO' | 'AUSENTE' | 'SALIDA_PENDIENTE' | 'FINALIZADO';

export interface ParametrosAsistencia {
  toleranciaRetrasoMin: number;
  minutosAusente: number;
  alertaSalidaMin: number;
}

export interface TurnoConMarcaciones {
  inicio: Date;
  fin: Date;
  entrada?: Date;
  salida?: Date;
}

const MIN = 60 * 1000;

export function estadoTurno(t: TurnoConMarcaciones, ahora: Date, p: ParametrosAsistencia): EstadoTurno {
  if (t.salida) return 'FINALIZADO';
  const ms = ahora.getTime();
  if (t.entrada) {
    return ms >= t.fin.getTime() + p.alertaSalidaMin * MIN ? 'SALIDA_PENDIENTE' : 'EN_TURNO';
  }
  const retraso = (ms - t.inicio.getTime()) / MIN;
  if (retraso >= p.minutosAusente) return 'AUSENTE';
  if (retraso > p.toleranciaRetrasoMin) return 'RETRASADO';
  return 'PROGRAMADO';
}
