import { describe, expect, it } from 'vitest';
import { aHoras, calcularMinutos, horaAMinutos, type OpcionesCalculoHoras } from './horas.js';

// Hora local de Bogotá (UTC-5).
const bog = (fechaHora: string) => new Date(`${fechaHora}:00-05:00`);

const FESTIVOS = new Set(['2025-12-25', '2026-10-12']);

const opciones: OpcionesCalculoHoras = {
  // Ley 2466 de 2025: la nocturna empieza a las 19:00 desde el 25-dic-2025 (antes a las 21:00).
  franjaNocturna: (fecha) => ({
    inicioMin: horaAMinutos(fecha >= '2025-12-25' ? '19:00' : '21:00'),
    finMin: horaAMinutos('06:00'),
  }),
  esFestivo: (fecha) => FESTIVOS.has(fecha),
};

const horas = (inicio: string, fin: string) => aHoras(calcularMinutos(bog(inicio), bog(fin), opciones));

// Casos obligatorios de RN-01 (plan técnico §5). 2026-09-29 es martes; 2026-10-03 es sábado.
describe('RN-01 · franjas diurna y nocturna', () => {
  it('martes 07:00–13:00 → 6 diurnas', () => {
    expect(horas('2026-09-29T07:00', '2026-09-29T13:00')).toEqual({
      diurnasOrdinarias: 6, nocturnasOrdinarias: 0, diurnasDominicales: 0, nocturnasDominicales: 0,
    });
  });

  it('martes 13:00–21:00 → 6 diurnas y 2 nocturnas (cruza las 19:00)', () => {
    expect(horas('2026-09-29T13:00', '2026-09-29T21:00')).toEqual({
      diurnasOrdinarias: 6, nocturnasOrdinarias: 2, diurnasDominicales: 0, nocturnasDominicales: 0,
    });
  });

  it('martes 19:00–miércoles 07:00 → 1 diurna y 11 nocturnas (cruza medianoche)', () => {
    expect(horas('2026-09-29T19:00', '2026-09-30T07:00')).toEqual({
      diurnasOrdinarias: 1, nocturnasOrdinarias: 11, diurnasDominicales: 0, nocturnasDominicales: 0,
    });
  });

  it('sábado 19:00–domingo 07:00 → 5 nocturnas ordinarias, 6 nocturnas y 1 diurna dominicales', () => {
    expect(horas('2026-10-03T19:00', '2026-10-04T07:00')).toEqual({
      diurnasOrdinarias: 0, nocturnasOrdinarias: 5, diurnasDominicales: 1, nocturnasDominicales: 6,
    });
  });

  it('24-dic-2025 19:00 → 25-dic 07:00: cambia la franja y el día es festivo a mitad de turno', () => {
    // 24-dic rige 21:00: 19–21 diurnas, 21–24 nocturnas. 25-dic es festivo: 00–06 nocturnas, 06–07 diurna.
    expect(horas('2025-12-24T19:00', '2025-12-25T07:00')).toEqual({
      diurnasOrdinarias: 2, nocturnasOrdinarias: 3, diurnasDominicales: 1, nocturnasDominicales: 6,
    });
  });

  it('lunes festivo 12-oct-2026 07:00–19:00 → 12 diurnas dominicales', () => {
    expect(horas('2026-10-12T07:00', '2026-10-12T19:00').diurnasDominicales).toBe(12);
  });

  it('intervalo vacío o invertido → cero', () => {
    const cero = horas('2026-09-29T07:00', '2026-09-29T07:00');
    expect(Object.values(cero).every((v) => v === 0)).toBe(true);
  });

  it('marcación real con minutos sueltos 07:04–13:02', () => {
    const m = calcularMinutos(bog('2026-09-29T07:04'), bog('2026-09-29T13:02'), opciones);
    expect(m.diurnasOrdinarias).toBe(358);
  });
});
