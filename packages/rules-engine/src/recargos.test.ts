import { describe, expect, it } from 'vitest';
import { factores, valorizarRecargos, type HorasClasificadas } from './recargos.js';

const VIGENTES_2026 = { nocturnoPct: 35, extraDiurnaPct: 25, extraNocturnaPct: 75, dominicalPct: 90 };
const DESDE_JULIO_2027 = { ...VIGENTES_2026, dominicalPct: 100 };

const sinHoras: HorasClasificadas = {
  nocturnasOrdinarias: 0, diurnasDominicales: 0, nocturnasDominicales: 0,
  extraDiurnas: 0, extraNocturnas: 0, extraDiurnasDominicales: 0, extraNocturnasDominicales: 0,
};

describe('RN-07 · recargos', () => {
  it('reproduce la tabla del cliente (docs/cliente/tabla_recargos.png)', () => {
    const f = factores(VIGENTES_2026);
    expect(f.nocturnasOrdinarias).toBeCloseTo(0.35);
    expect(f.extraDiurnas).toBeCloseTo(1.25);
    expect(f.extraNocturnas).toBeCloseTo(1.75);
    expect(f.diurnasDominicales).toBeCloseTo(0.9);
    expect(f.nocturnasDominicales).toBeCloseTo(1.25);
    expect(f.extraDiurnasDominicales).toBeCloseTo(2.15);
    expect(f.extraNocturnasDominicales).toBeCloseTo(2.65);
  });

  it('se actualiza solo con el recargo dominical del 100 % (1-jul-2027)', () => {
    const f = factores(DESDE_JULIO_2027);
    expect(f.nocturnasDominicales).toBeCloseTo(1.35);
    expect(f.extraNocturnasDominicales).toBeCloseTo(2.75);
  });

  it('ejemplo del documento de decisiones: noche sábado→domingo de una jefe con $2.800.000', () => {
    const r = valorizarRecargos(
      { ...sinHoras, nocturnasOrdinarias: 5, nocturnasDominicales: 6, diurnasDominicales: 1 },
      2_800_000,
      210,
      VIGENTES_2026,
    );
    expect(r.valorHora).toBeCloseTo(13_333.33, 1);
    expect(Math.round(r.total)).toBe(135_333);
  });
});
