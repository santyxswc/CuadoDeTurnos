import { describe, expect, it } from 'vitest';
import { estadoTurno } from './asistencia.js';

const bog = (h: string) => new Date(`2026-09-29T${h}:00-05:00`);
const P = { toleranciaRetrasoMin: 10, minutosAusente: 60, alertaSalidaMin: 30 };
const turno = { inicio: bog('07:00'), fin: bog('13:00') };

describe('estado del turno (RF-MAIN-02)', () => {
  it('HU-01: entra a las 07:04 con tolerancia de 10 min → En turno', () => {
    expect(estadoTurno({ ...turno, entrada: bog('07:04') }, bog('07:05'), P)).toBe('EN_TURNO');
  });
  it('sin entrada a las 07:05 → Programado', () => {
    expect(estadoTurno(turno, bog('07:05'), P)).toBe('PROGRAMADO');
  });
  it('sin entrada a las 07:11 → Retrasado', () => {
    expect(estadoTurno(turno, bog('07:11'), P)).toBe('RETRASADO');
  });
  it('sin entrada a las 08:00 → Ausente', () => {
    expect(estadoTurno(turno, bog('08:00'), P)).toBe('AUSENTE');
  });
  it('con entrada y sin salida 30 min después del fin → Salida pendiente', () => {
    expect(estadoTurno({ ...turno, entrada: bog('07:00') }, bog('13:30'), P)).toBe('SALIDA_PENDIENTE');
  });
  it('con salida → Finalizado', () => {
    expect(estadoTurno({ ...turno, entrada: bog('07:00'), salida: bog('13:01') }, bog('13:05'), P)).toBe('FINALIZADO');
  });
});
