// Datos iniciales cuando la carpeta de datos está vacía: primer coordinador, tipos de turno,
// parámetros laborales con sus vigencias y festivos de Colombia.
import type { Logger } from '@nestjs/common';
import { festivosColombia } from '@sgt/rules-engine';
import { PARAMETROS_DEFECTO, type ValorParametro } from '@sgt/shared-types';
import { randomUUID } from 'node:crypto';
import type { ConfigSgt } from '../config';
import { generarPasswordTemporal, hashPassword } from '../auth/passwords';
import type { AlmacenService } from './almacen.service';
import type { ParametroGuardado } from './modelos';

const TIPOS_TURNO = [
  { codigo: 'M', nombre: 'Mañana', horaInicio: '07:00', horaFin: '13:00', color: '#f5c451' },
  { codigo: 'T', nombre: 'Tarde', horaInicio: '13:00', horaFin: '19:00', color: '#f08a5d' },
  { codigo: 'N', nombre: 'Noche', horaInicio: '19:00', horaFin: '07:00', color: '#5d6cc0' },
  { codigo: 'D', nombre: 'Día largo', horaInicio: '07:00', horaFin: '19:00', color: '#3fa796' },
];

/** Valores que cambian por ley en fechas conocidas (ADR-004). El resto rige desde el 1-ene-2025. */
const VIGENCIAS_LEGALES: [string, ValorParametro, string, string | null][] = [
  // Ley 2466 de 2025: la jornada nocturna empieza a las 19:00 desde el 25-dic-2025.
  ['jornada.inicio_nocturna', '21:00', '2025-01-01', '2025-12-24'],
  ['jornada.inicio_nocturna', '19:00', '2025-12-25', null],
  // Ley 2101 de 2021: 44 h desde el 15-jul-2025, 42 h desde el 15-jul-2026.
  ['jornada.maxima_semanal_h', 44, '2025-07-15', '2026-07-14'],
  ['jornada.maxima_semanal_h', 42, '2026-07-15', null],
  ['jornada.divisor_mensual_h', 220, '2025-07-15', '2026-07-14'],
  ['jornada.divisor_mensual_h', 210, '2026-07-15', null],
  // Ley 2466 de 2025: recargo dominical 80 % → 90 % → 100 %.
  ['recargo.dominical_pct', 80, '2025-07-01', '2026-06-30'],
  ['recargo.dominical_pct', 90, '2026-07-01', '2027-06-30'],
  ['recargo.dominical_pct', 100, '2027-07-01', null],
];

export async function sembrar(almacen: AlmacenService, config: ConfigSgt, logger: Logger) {
  if (almacen.usuarios.todos().length === 0) {
    const password = config.passwordAdmin ?? generarPasswordTemporal();
    await almacen.usuarios.insertar({
      id: randomUUID(),
      documento: config.documentoAdmin,
      nombres: 'Coordinador/a',
      email: null,
      rol: 'COORDINADOR',
      cargo: 'JEFE',
      fechaIngreso: new Date().toISOString().slice(0, 10),
      activo: true,
      hashPassword: await hashPassword(password),
      debeCambiarPassword: true,
      salarios: [],
      creadoEn: new Date().toISOString(),
    });
    logger.warn(`Se creó el primer coordinador. Usuario: ${config.documentoAdmin} · contraseña temporal: ${password}`);
  }

  if (almacen.tiposTurno.todos().length === 0) {
    await almacen.tiposTurno.insertarVarios(TIPOS_TURNO.map((t) => ({ ...t, id: randomUUID(), activo: true })));
  }

  if (almacen.parametros.todos().length === 0) {
    const conVigencia = new Set(VIGENCIAS_LEGALES.map(([clave]) => clave));
    const params: ParametroGuardado[] = [
      ...Object.entries(PARAMETROS_DEFECTO)
        .filter(([clave]) => !conVigencia.has(clave))
        .map(([clave, valor]) => ({ clave, valor, vigenteDesde: '2025-01-01', vigenteHasta: null })),
      ...VIGENCIAS_LEGALES.map(([clave, valor, vigenteDesde, vigenteHasta]) => ({ clave, valor, vigenteDesde, vigenteHasta })),
    ].map((p) => ({ ...p, id: `${p.clave}@${p.vigenteDesde}` }));
    await almacen.parametros.insertarVarios(params);
  }

  if (almacen.festivos.todos().length === 0) {
    const anio = new Date().getFullYear();
    const festivos = [...festivosColombia(anio), ...festivosColombia(anio + 1)];
    await almacen.festivos.insertarVarios(festivos.map((f) => ({ ...f, id: f.fecha })));
  }
}
