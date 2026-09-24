// Tipos compartidos entre la API (NestJS) y la app de escritorio (React).
// Los enums se declaran como objetos `as const` para que sirvan como valores y como tipos.

export const Rol = {
  ENFERMERO: 'ENFERMERO',
  COORDINADOR: 'COORDINADOR',
} as const;
export type Rol = (typeof Rol)[keyof typeof Rol];

/** Cargo laboral (ADR-008). Es independiente del rol dentro de la app. */
export const Cargo = {
  AUXILIAR: 'AUXILIAR',
  PROFESIONAL: 'PROFESIONAL',
  JEFE: 'JEFE',
  ESPECIALISTA: 'ESPECIALISTA',
} as const;
export type Cargo = (typeof Cargo)[keyof typeof Cargo];

export const NOMBRE_CARGO: Record<Cargo, string> = {
  AUXILIAR: 'Auxiliar de enfermería',
  PROFESIONAL: 'Enfermero/a profesional',
  JEFE: 'Enfermero/a jefe',
  ESPECIALISTA: 'Enfermero/a especialista',
};

export const EstadoCuadro = {
  BORRADOR: 'BORRADOR',
  PUBLICADO: 'PUBLICADO',
  CERRADO: 'CERRADO',
} as const;
export type EstadoCuadro = (typeof EstadoCuadro)[keyof typeof EstadoCuadro];

export const EstadoAsignacion = {
  ACTIVA: 'ACTIVA',
  LIBERADA: 'LIBERADA',
  REEMPLAZADA: 'REEMPLAZADA',
} as const;
export type EstadoAsignacion = (typeof EstadoAsignacion)[keyof typeof EstadoAsignacion];

export const TipoMarcacion = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
} as const;
export type TipoMarcacion = (typeof TipoMarcacion)[keyof typeof TipoMarcacion];

/** Indicadores de la página principal (RF-MAIN-02). */
export const EstadoTurno = {
  PROGRAMADO: 'PROGRAMADO',
  EN_TURNO: 'EN_TURNO',
  RETRASADO: 'RETRASADO',
  AUSENTE: 'AUSENTE',
  SALIDA_PENDIENTE: 'SALIDA_PENDIENTE',
  FINALIZADO: 'FINALIZADO',
} as const;
export type EstadoTurno = (typeof EstadoTurno)[keyof typeof EstadoTurno];

export const TipoSolicitud = {
  INTERCAMBIO: 'INTERCAMBIO',
  CESION: 'CESION',
  PERMISO: 'PERMISO',
  VACACIONES: 'VACACIONES',
} as const;
export type TipoSolicitud = (typeof TipoSolicitud)[keyof typeof TipoSolicitud];

/** Máquina de estados de §9.7 del plan técnico. */
export const EstadoSolicitud = {
  BORRADOR: 'BORRADOR',
  PENDIENTE_COMPANERO: 'PENDIENTE_COMPANERO',
  RECHAZADA_COMPANERO: 'RECHAZADA_COMPANERO',
  PENDIENTE_COORDINADOR: 'PENDIENTE_COORDINADOR',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  CANCELADA: 'CANCELADA',
  APLICADA: 'APLICADA',
} as const;
export type EstadoSolicitud = (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud];

export const CategoriaPermiso = {
  PERSONAL: 'PERSONAL',
  CALAMIDAD: 'CALAMIDAD',
  CITA_MEDICA: 'CITA_MEDICA',
  ACADEMICO: 'ACADEMICO',
  OTRO: 'OTRO',
} as const;
export type CategoriaPermiso = (typeof CategoriaPermiso)[keyof typeof CategoriaPermiso];

/** Estado de egreso del paciente (RF-PAC-05). */
export const EstadoEgreso = {
  CONTINUA_HOSPITALIZADO: 'CONTINUA_HOSPITALIZADO',
  ALTA_MEJORADO: 'ALTA_MEJORADO',
  REMITIDO: 'REMITIDO',
  ALTA_VOLUNTARIA: 'ALTA_VOLUNTARIA',
  FALLECIDO: 'FALLECIDO',
  OTRO: 'OTRO',
} as const;
export type EstadoEgreso = (typeof EstadoEgreso)[keyof typeof EstadoEgreso];

export const TipoDocumento = {
  CC: 'CC',
  TI: 'TI',
  RC: 'RC',
  CE: 'CE',
  PA: 'PA',
  PPT: 'PPT',
} as const;
export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento];

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface UsuarioResumenDto {
  id: string;
  nombres: string;
  rol: Rol;
  cargo: Cargo;
  activo: boolean;
}

export interface TipoTurnoDto {
  id: string;
  codigo: string;
  nombre: string;
  /** Hora local "HH:mm". */
  horaInicio: string;
  /** Hora local "HH:mm". Si es menor o igual a horaInicio, el turno termina al día siguiente. */
  horaFin: string;
  color: string;
}

export interface AsignacionDto {
  id: string;
  usuarioId: string;
  tipoTurnoId: string;
  /** ISO 8601 en UTC. */
  inicio: string;
  fin: string;
  estado: EstadoAsignacion;
}

export interface IndicadorTurnoDto {
  usuarioId: string;
  asignacionId: string;
  estado: EstadoTurno;
  entrada?: string;
  salida?: string;
}

export interface MensajeChatDto {
  id: string;
  autorId: string;
  contenido: string;
  esNovedad: boolean;
  creadoEn: string;
}

// ---------------------------------------------------------------------------
// Parámetros laborales por defecto (docs/02_Decisiones_Respuestas_Cliente.md §2)
// ---------------------------------------------------------------------------

export const PARAMETROS_DEFECTO = {
  'jornada.inicio_nocturna': '19:00',
  'jornada.fin_nocturna': '06:00',
  'jornada.maxima_semanal_h': 42,
  'jornada.divisor_mensual_h': 210,
  'extra.max_diarias_h': 2,
  'extra.max_semanales_h': 12,
  'aptitud.umbral_alerta_pct': 90,
  'aptitud.descanso_minimo_h': 12,
  'aptitud.max_noches_consecutivas': 3,
  'aptitud.max_horas_continuas': 12,
  'aptitud.dias_descanso_semana': 1,
  'asistencia.tolerancia_retraso_min': 10,
  'asistencia.minutos_ausente': 60,
  'asistencia.ventana_asociacion_h': 2,
  'asistencia.alerta_salida_min': 30,
  'vacaciones.dias_por_anio': 15,
  'vacaciones.anticipacion_min_dias': 15,
  'vacaciones.permitir_anticipadas': false,
  'seguridad.inactividad_min': 15,
  'chat.minutos_edicion': 10,
  'recargo.nocturno_pct': 35,
  'recargo.extra_diurna_pct': 25,
  'recargo.extra_nocturna_pct': 75,
  'recargo.dominical_pct': 90,
  /** SMMLV de referencia para validar salarios. Valor 2025: actualizar con el decreto vigente. */
  'nomina.smmlv': 1_423_500,
} as const;

export type ClaveParametro = keyof typeof PARAMETROS_DEFECTO;

export const ZONA_HORARIA = 'America/Bogota';
