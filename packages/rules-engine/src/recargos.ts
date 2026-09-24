// RN-07 · Valor estimado de recargos (ADR-008).
// Se parametrizan los porcentajes base; los combinados (dominical + nocturno, dominical + extra)
// se obtienen sumando, igual que en la tabla enviada por el cliente.

export interface PorcentajesRecargo {
  nocturnoPct: number;
  extraDiurnaPct: number;
  extraNocturnaPct: number;
  dominicalPct: number;
}

/** Horas ya clasificadas. Las ordinarias diurnas no generan recargo. */
export interface HorasClasificadas {
  nocturnasOrdinarias: number;
  diurnasDominicales: number;
  nocturnasDominicales: number;
  extraDiurnas: number;
  extraNocturnas: number;
  extraDiurnasDominicales: number;
  extraNocturnasDominicales: number;
}

export interface ValorRecargos {
  valorHora: number;
  conceptos: Record<keyof HorasClasificadas, number>;
  total: number;
}

/**
 * Factor que se multiplica por el valor hora para cada concepto.
 * Las horas ordinarias ya están pagadas en el salario, así que solo suman el recargo.
 * Las horas extra se pagan completas: la hora (1) más su recargo.
 */
export function factores(p: PorcentajesRecargo): Record<keyof HorasClasificadas, number> {
  const pct = (n: number) => n / 100;
  return {
    nocturnasOrdinarias: pct(p.nocturnoPct),
    diurnasDominicales: pct(p.dominicalPct),
    nocturnasDominicales: pct(p.dominicalPct + p.nocturnoPct),
    extraDiurnas: 1 + pct(p.extraDiurnaPct),
    extraNocturnas: 1 + pct(p.extraNocturnaPct),
    extraDiurnasDominicales: 1 + pct(p.dominicalPct + p.extraDiurnaPct),
    extraNocturnasDominicales: 1 + pct(p.dominicalPct + p.extraNocturnaPct),
  };
}

export function valorizarRecargos(
  horas: HorasClasificadas,
  salarioBase: number,
  divisorMensualHoras: number,
  porcentajes: PorcentajesRecargo,
): ValorRecargos {
  const valorHora = salarioBase / divisorMensualHoras;
  const f = factores(porcentajes);
  const conceptos = {} as Record<keyof HorasClasificadas, number>;
  let total = 0;
  for (const clave of Object.keys(f) as (keyof HorasClasificadas)[]) {
    conceptos[clave] = horas[clave] * valorHora * f[clave];
    total += conceptos[clave];
  }
  return { valorHora, conceptos, total };
}
