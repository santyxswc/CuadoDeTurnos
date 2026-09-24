import { useState } from 'react';
import { factores, valorizarRecargos, type HorasClasificadas } from '@sgt/rules-engine';
import { NOMBRE_CARGO, PARAMETROS_DEFECTO as P } from '@sgt/shared-types';
import { useEstado, useUsuario } from '../estado';
import { PERSONAS, persona } from '../datos/mock';
import { diaMes, horaLocal, horas, pesos } from '../datos/fechas';
import { clasificar, filasHoras, type Fuente } from '../datos/liquidacion';
import { PORCENTAJES_RECARGO } from '../datos/reglas';
import { Chip, Dato, Tarjeta } from '../componentes/Ui';

const CONCEPTOS: Record<keyof HorasClasificadas, string> = {
  nocturnasOrdinarias: 'Recargo nocturno ordinario',
  diurnasDominicales: 'Dominical/festiva diurna',
  nocturnasDominicales: 'Nocturna dominical/festiva',
  extraDiurnas: 'Hora extra diurna',
  extraNocturnas: 'Hora extra nocturna',
  extraDiurnasDominicales: 'Extra diurna dominical/festiva',
  extraNocturnasDominicales: 'Extra nocturna dominical/festiva',
};

export function MisHoras() {
  const usuario = useUsuario()!;
  const { asignaciones, marcaciones } = useEstado();
  const esCoordinador = usuario.rol === 'COORDINADOR';
  const [usuarioId, setUsuarioId] = useState(usuario.id);
  const [fuente, setFuente] = useState<Fuente>('programadas');
  const p = persona(usuarioId);

  const todas = filasHoras(usuarioId, asignaciones, marcaciones, fuente);
  const filas = todas.filter((f) => f.a.fecha.startsWith('2026-10'));
  const suma = (k: 'total' | 'diurnas' | 'nocturnas' | 'dominicalesDiurnas' | 'dominicalesNocturnas' | 'extra') => filas.reduce((s, f) => s + f[k], 0);
  const clasificadas = clasificar(filas);
  const valor = valorizarRecargos(clasificadas, p.salario, P['jornada.divisor_mensual_h'], PORCENTAJES_RECARGO);
  const f = factores(PORCENTAJES_RECARGO);

  return (
    <div className="pila">
      <div className="fila">
        <div className="espaciador">
          <h2>Horas y recargos · octubre 2026</h2>
          <p className="sub">Horas diurnas (06:00–19:00), nocturnas (19:00–06:00), dominicales y festivas, calculadas con el motor de reglas.</p>
        </div>
        {esCoordinador && (
          <label style={{ maxWidth: 260 }}>
            Persona
            <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
              {PERSONAS.map((x) => <option key={x.id} value={x.id}>{x.nombres}</option>)}
            </select>
          </label>
        )}
        <label style={{ maxWidth: 300 }}>
          Fuente
          <select value={fuente} onChange={(e) => setFuente(e.target.value as Fuente)}>
            <option value="reales">Reales: marcaciones (oficial para nómina)</option>
            <option value="programadas">Programadas: cuadro del mes (proyección)</option>
          </select>
        </label>
      </div>

      <div className="columnas c4">
        <Dato etiqueta="Total de horas" valor={horas(suma('total'))} nota={fuente === 'reales' ? 'Hasta hoy, según marcaciones' : 'Mes completo según el cuadro'} />
        <Dato etiqueta="Diurnas / nocturnas ordinarias" valor={`${horas(suma('diurnas'))} / ${horas(suma('nocturnas'))}`} />
        <Dato etiqueta="Dominicales y festivas (diurnas / nocturnas)" valor={`${horas(suma('dominicalesDiurnas'))} / ${horas(suma('dominicalesNocturnas'))}`} />
        <Dato etiqueta={`Exceso sobre ${P['jornada.maxima_semanal_h']} h semanales`} valor={horas(suma('extra'))} nota="Posibles horas extra" />
      </div>

      <div className="columnas" style={{ alignItems: 'start', gridTemplateColumns: '3fr 2fr' }}>
        <Tarjeta titulo="Detalle por turno">
          <div className="desplazable" style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table className="nowrap">
              <thead>
                <tr>
                  <th>Fecha</th><th>Turno</th><th>Horario</th>
                  <th className="num">Diurnas</th><th className="num">Nocturnas</th>
                  <th className="num">Dom. diurnas</th><th className="num">Dom. nocturnas</th><th className="num">Extra</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((x) => (
                  <tr key={x.a.id}>
                    <td>{diaMes(x.a.fecha)}</td>
                    <td><Chip codigo={x.a.codigo} /></td>
                    <td>{horaLocal(x.inicio)}–{horaLocal(x.fin)}</td>
                    <td className="num">{horas(x.diurnas)}</td>
                    <td className="num">{horas(x.nocturnas)}</td>
                    <td className="num">{horas(x.dominicalesDiurnas)}</td>
                    <td className="num">{horas(x.dominicalesNocturnas)}</td>
                    <td className="num">{x.extra ? horas(x.extra) : ''}</td>
                  </tr>
                ))}
                {filas.length === 0 && <tr><td colSpan={8}>Sin turnos con marcaciones completas en el período.</td></tr>}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Valor estimado de recargos">
          <p className="sub">
            {p.nombres} · {NOMBRE_CARGO[p.cargo]} · salario {pesos(p.salario)} · valor hora {pesos(valor.valorHora)} (salario ÷ {P['jornada.divisor_mensual_h']} h)
          </p>
          {p.salario < P['nomina.smmlv'] && (
            <div className="alerta-caja error" style={{ marginBottom: 10 }}>
              El salario registrado es inferior al salario mínimo de referencia ({pesos(P['nomina.smmlv'])}). Verificar con talento humano.
            </div>
          )}
          <table>
            <thead>
              <tr><th>Concepto</th><th className="num">Horas</th><th className="num">Factor</th><th className="num">Valor</th></tr>
            </thead>
            <tbody>
              {(Object.keys(CONCEPTOS) as (keyof HorasClasificadas)[]).map((k) => (
                <tr key={k}>
                  <td>{CONCEPTOS[k]}</td>
                  <td className="num">{horas(clasificadas[k])}</td>
                  <td className="num">{f[k].toFixed(2).replace('.', ',')}</td>
                  <td className="num">{pesos(valor.conceptos[k])}</td>
                </tr>
              ))}
              <tr className="total"><td>Total estimado</td><td /><td /><td className="num">{pesos(valor.total)}</td></tr>
            </tbody>
          </table>
          <div className="alerta-caja aviso" style={{ marginTop: 10 }}>
            Valor estimado de recargos. La liquidación oficial la hace nómina. El recargo dominical es {PORCENTAJES_RECARGO.dominicalPct} % desde el 1-jul-2026 y pasa a 100 % el 1-jul-2027 (parámetro con vigencia).
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}
