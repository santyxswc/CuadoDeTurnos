import { describe, expect, it } from 'vitest';
import { evaluarAptitud, type Intervalo } from './aptitud.js';

const bog = (fh: string) => new Date(`${fh}:00-05:00`);
const t = (ini: string, fin: string): Intervalo => ({ inicio: bog(ini), fin: bog(fin) });
const P = { descansoMinimoH: 12, maximaSemanalH: 42, maxExtraSemanalH: 12, umbralAlertaPct: 90, maxNochesConsecutivas: 3 };
const libre = { activo: true, asignaciones: [], ausencias: [] };

// Semana del lunes 19 al domingo 25 de octubre de 2026.
const noche20 = t('2026-10-20T19:00', '2026-10-21T07:00');

describe('RN-03 · filtro de aptos', () => {
  it('persona sin asignaciones → Apto', () => {
    const r = evaluarAptitud(libre, noche20, P);
    expect(r.clasificacion).toBe('APTO');
    expect(r.horasSemana).toBe(12);
  });

  it('HU-04: 8 h de descanso → No apto con el motivo', () => {
    const r = evaluarAptitud({ ...libre, asignaciones: [t('2026-10-20T07:00', '2026-10-20T11:00')] }, noche20, P);
    expect(r.clasificacion).toBe('NO_APTO');
    expect(r.motivos).toContain('Descanso de 8 h antes del turno < 12 h mínimo');
  });

  it('asignación que se cruza → No apto', () => {
    const r = evaluarAptitud({ ...libre, asignaciones: [t('2026-10-20T13:00', '2026-10-20T20:00')] }, noche20, P);
    expect(r.motivos).toContain('Tiene otra asignación que se cruza');
  });

  it('en vacaciones → No apto', () => {
    const r = evaluarAptitud({ ...libre, ausencias: [t('2026-10-19T00:00', '2026-10-26T00:00')] }, noche20, P);
    expect(r.clasificacion).toBe('NO_APTO');
  });

  it('38 h en la semana (> 90 % de 42) → Apto con advertencia', () => {
    const semana = [
      t('2026-10-19T07:00', '2026-10-19T19:00'),
      t('2026-10-22T07:00', '2026-10-22T13:00'),
      t('2026-10-23T07:00', '2026-10-23T15:00'),
    ];
    const r = evaluarAptitud({ ...libre, asignaciones: semana }, noche20, P);
    expect(r.horasSemana).toBe(38);
    expect(r.clasificacion).toBe('APTO_CON_ADVERTENCIA');
  });

  it('superar 42 + 12 h → No apto', () => {
    const semana = [19, 22, 23, 24].map((d) => t(`2026-10-${d}T07:00`, `2026-10-${d}T19:00`));
    const r = evaluarAptitud({ ...libre, asignaciones: semana }, noche20, P);
    expect(r.horasSemana).toBe(60);
    expect(r.clasificacion).toBe('NO_APTO');
  });

  it('cuarta noche seguida → No apto', () => {
    const noches = [17, 18, 19].map((d) => t(`2026-10-${d}T19:00`, `2026-10-${d + 1}T07:00`));
    const r = evaluarAptitud({ ...libre, asignaciones: noches }, noche20, P);
    expect(r.motivos).toContain('Serían 4 noches seguidas (máximo 3)');
  });
});
