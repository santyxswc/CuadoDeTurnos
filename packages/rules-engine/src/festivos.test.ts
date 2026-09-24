import { describe, expect, it } from 'vitest';
import { domingoDePascua, festivosColombia } from './festivos.js';

describe('festivos de Colombia', () => {
  it('calcula el domingo de Pascua', () => {
    expect(domingoDePascua(2025).toISOString().slice(0, 10)).toBe('2025-04-20');
    expect(domingoDePascua(2026).toISOString().slice(0, 10)).toBe('2026-04-05');
    expect(domingoDePascua(2027).toISOString().slice(0, 10)).toBe('2027-03-28');
  });

  it('2026: 18 festivos, iguales al calendario oficial', () => {
    expect(festivosColombia(2026).map((f) => f.fecha)).toEqual([
      '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
      '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
      '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
    ]);
  });

  it('2025 coincide con el calendario oficial y une los festivos que caen el mismo día', () => {
    const f2025 = festivosColombia(2025);
    expect(f2025.find((f) => f.fecha === '2025-06-30')?.nombre).toBe('San Pedro y San Pablo / Sagrado Corazón');
    expect(f2025.map((f) => f.fecha)).toEqual([
      '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18', '2025-05-01',
      '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20', '2025-08-07', '2025-08-18',
      '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08', '2025-12-25',
    ]);
  });

  it('los festivos fijos no se trasladan aunque caigan en fin de semana (2027)', () => {
    const f = festivosColombia(2027).map((x) => x.fecha);
    expect(f).toContain('2027-05-01'); // sábado
    expect(f).toContain('2027-08-07'); // sábado
    expect(f).toContain('2027-12-25'); // sábado
    expect(f).toContain('2027-01-11'); // Reyes trasladado al lunes
    expect(f).toContain('2027-05-10'); // Ascensión
  });
});
