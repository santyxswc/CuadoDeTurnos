const OFFSET_BOGOTA_MS = -5 * 3600 * 1000;

/** Fecha de hoy en Bogotá, "YYYY-MM-DD". */
export const hoyBogota = (ahora = new Date()) => new Date(ahora.getTime() + OFFSET_BOGOTA_MS).toISOString().slice(0, 10);

export const diaAnterior = (fecha: string) => new Date(Date.parse(`${fecha}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** Valida "YYYY-MM-DD" y que la fecha exista (rechaza 2026-02-30). */
export function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  return new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha;
}
