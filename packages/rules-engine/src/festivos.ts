// Festivos de Colombia (Ley 51 de 1983, "Ley Emiliani") calculados para cualquier año.
// Sirve para precargar el calendario (RF-ADM-02); el coordinador puede editarlo después.

export interface Festivo {
  /** "YYYY-MM-DD" */
  fecha: string;
  nombre: string;
}

const DIA_MS = 86_400_000;

const fecha = (anio: number, mes: number, dia: number) => new Date(Date.UTC(anio, mes - 1, dia));
const texto = (d: Date) => d.toISOString().slice(0, 10);
const sumarDias = (d: Date, n: number) => new Date(d.getTime() + n * DIA_MS);

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). */
export function domingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return fecha(anio, mes, dia);
}

/** Ley Emiliani: si no cae en lunes, el festivo se traslada al lunes siguiente. */
function alLunes(d: Date): Date {
  const diaSemana = d.getUTCDay(); // 0 = domingo, 1 = lunes
  return diaSemana === 1 ? d : sumarDias(d, (8 - diaSemana) % 7);
}

export function festivosColombia(anio: number): Festivo[] {
  const pascua = domingoDePascua(anio);
  const lista: [Date, string][] = [
    // Fijos
    [fecha(anio, 1, 1), 'Año Nuevo'],
    [fecha(anio, 5, 1), 'Día del Trabajo'],
    [fecha(anio, 7, 20), 'Día de la Independencia'],
    [fecha(anio, 8, 7), 'Batalla de Boyacá'],
    [fecha(anio, 12, 8), 'Inmaculada Concepción'],
    [fecha(anio, 12, 25), 'Navidad'],
    // Trasladables al lunes
    [alLunes(fecha(anio, 1, 6)), 'Reyes Magos'],
    [alLunes(fecha(anio, 3, 19)), 'San José'],
    [alLunes(fecha(anio, 6, 29)), 'San Pedro y San Pablo'],
    [alLunes(fecha(anio, 8, 15)), 'Asunción de la Virgen'],
    [alLunes(fecha(anio, 10, 12)), 'Día de la Raza'],
    [alLunes(fecha(anio, 11, 1)), 'Todos los Santos'],
    [alLunes(fecha(anio, 11, 11)), 'Independencia de Cartagena'],
    // Dependientes de la Pascua
    [sumarDias(pascua, -3), 'Jueves Santo'],
    [sumarDias(pascua, -2), 'Viernes Santo'],
    [alLunes(sumarDias(pascua, 39)), 'Ascensión del Señor'],
    [alLunes(sumarDias(pascua, 60)), 'Corpus Christi'],
    [alLunes(sumarDias(pascua, 68)), 'Sagrado Corazón'],
  ];
  // Dos festivos pueden caer el mismo lunes (ej. 30-jun-2025: San Pedro y Sagrado Corazón): se unen los nombres.
  const porFecha = new Map<string, string>();
  for (const [d, nombre] of lista) {
    const f = texto(d);
    porFecha.set(f, porFecha.has(f) ? `${porFecha.get(f)} / ${nombre}` : nombre);
  }
  return [...porFecha].map(([f, nombre]) => ({ fecha: f, nombre })).sort((x, y) => x.fecha.localeCompare(y.fecha));
}
