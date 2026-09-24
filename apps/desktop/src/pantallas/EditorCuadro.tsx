import { Fragment, useMemo, useState } from 'react';
import { PARAMETROS_DEFECTO as P } from '@sgt/shared-types';
import { useEstado } from '../estado';
import { FESTIVOS, PERSONAS, TIPOS_TURNO } from '../datos/mock';
import { diaSemana, encabezadoDia, horas, lunesDe, rangoFechas } from '../datos/fechas';
import { aptitudPara, horasPorSemana } from '../datos/reglas';
import { Chip, Estado, Tarjeta } from '../componentes/Ui';

const CICLO = ['', ...TIPOS_TURNO.map((t) => t.codigo)];
const DIAS = rangoFechas('2026-11-02', '2026-11-29');

export function EditorCuadro() {
  const { borrador, estadoBorrador, cambiarCeldaBorrador, publicarBorrador, solicitudes } = useEstado();
  const [confirmar, setConfirmar] = useState(false);

  // RF-CUA-03: advertencias por celda, evaluadas con el mismo motor de reglas que usa la API.
  const advertencias = useMemo(() => {
    const r: Record<string, string[]> = {};
    for (const a of borrador) {
      const res = aptitudPara(a.usuarioId, a, borrador, solicitudes, [a.id]);
      if (res.clasificacion === 'NO_APTO') r[a.id] = res.motivos.filter((m) => !m.includes('semana'));
      if (r[a.id]?.length === 0) delete r[a.id];
    }
    return r;
  }, [borrador, solicitudes]);

  const totalAdvertencias = Object.keys(advertencias).length;
  const publicado = estadoBorrador === 'PUBLICADO';

  const cobertura = (fecha: string, codigo: string) =>
    borrador.filter((a) => a.fecha === fecha && a.codigo === codigo).length;

  return (
    <div className="pila">
      <div>
        <h2>Editor de cuadro · noviembre 2026</h2>
        <p className="sub">
          Haz clic en una celda para cambiar el turno (vacío → M → T → N → D). Las advertencias no bloquean: tú decides.
        </p>
      </div>
      <Tarjeta
        titulo={
          <>
            Cuadro de noviembre <Estado valor={estadoBorrador} />
          </>
        }
        acciones={
          <>
            <span className={`pill ${totalAdvertencias ? 'rojo' : 'verde'}`}>
              {totalAdvertencias ? `${totalAdvertencias} celdas con advertencia` : 'Sin advertencias'}
            </span>
            {!publicado && !confirmar && (
              <button className="primario" onClick={() => (totalAdvertencias ? setConfirmar(true) : publicarBorrador())}>
                Publicar cuadro
              </button>
            )}
          </>
        }
      >
        {confirmar && !publicado && (
          <div className="alerta-caja aviso fila" style={{ marginBottom: 12 }}>
            <span className="espaciador">
              Hay {totalAdvertencias} celdas con advertencias. ¿Quieres publicar de todas formas? Todo el equipo recibirá una notificación.
            </span>
            <button onClick={() => setConfirmar(false)}>Revisar</button>
            <button className="primario" onClick={() => { publicarBorrador(); setConfirmar(false); }}>
              Publicar igual
            </button>
          </div>
        )}
        {publicado && (
          <div className="alerta-caja info" style={{ marginBottom: 12 }}>
            Cuadro publicado. A partir de ahora cada cambio genera una nueva versión con autor, fecha y motivo (RF-CUA-05).
          </div>
        )}
        <div className="desplazable">
          <table className="cuadro">
            <thead>
              <tr>
                <th className="nombre">Persona</th>
                {DIAS.map((d) => (
                  <Fragment key={d}>
                    <th className={[d in FESTIVOS && 'festivo', diaSemana(d) === 0 && 'domingo'].filter(Boolean).join(' ')} title={FESTIVOS[d]}>
                      {encabezadoDia(d)}
                    </th>
                    {diaSemana(d) === 0 && <th title="Horas de la semana">Σ</th>}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERSONAS.map((p) => {
                const semanas = horasPorSemana(p.id, borrador);
                return (
                  <tr key={p.id}>
                    <td className="nombre">{p.nombres}</td>
                    {DIAS.map((d) => {
                      const a = borrador.find((x) => x.usuarioId === p.id && x.fecha === d);
                      const alerta = a && advertencias[a.id];
                      const siguiente = CICLO[(CICLO.indexOf(a?.codigo ?? '') + 1) % CICLO.length];
                      const h = semanas[lunesDe(d)] ?? 0;
                      return (
                        <Fragment key={d}>
                          <td
                            className={`celda ${alerta ? 'alerta' : ''}`}
                            title={alerta ? alerta.join('\n') : undefined}
                            onClick={() => !publicado && cambiarCeldaBorrador(p.id, d, siguiente)}
                          >
                            {a && <Chip codigo={a.codigo} />}
                          </td>
                          {diaSemana(d) === 0 && (
                            <td
                              className="num"
                              title={h > P['jornada.maxima_semanal_h'] ? `Exceso de ${horas(h - P['jornada.maxima_semanal_h'])} h` : undefined}
                              style={{ color: h > P['jornada.maxima_semanal_h'] + P['extra.max_semanales_h'] ? 'var(--rojo)' : h > P['jornada.maxima_semanal_h'] ? 'var(--amarillo)' : undefined, fontWeight: 600 }}
                            >
                              {horas(h)}
                            </td>
                          )}
                        </Fragment>
                      );
                    })}
                  </tr>
                );
              })}
              {TIPOS_TURNO.slice(0, 3).map((t) => (
                <tr key={t.codigo}>
                  <td className="nombre">
                    <small>Cobertura {t.nombre.toLowerCase()}</small>
                  </td>
                  {DIAS.map((d) => (
                    <Fragment key={d}>
                      <td style={{ color: cobertura(d, t.codigo) === 0 ? 'var(--rojo)' : 'var(--suave)', fontSize: 12 }}>{cobertura(d, t.codigo)}</td>
                      {diaSemana(d) === 0 && <td />}
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="leyenda" style={{ marginTop: 10 }}>
          <span className="pill rojo">⚠</span> Descanso menor a {P['aptitud.descanso_minimo_h']} h, cruce de turnos o más de {P['aptitud.max_noches_consecutivas']} noches seguidas (pasa el mouse para ver el motivo)
          · Σ en amarillo: más de {P['jornada.maxima_semanal_h']} h en la semana · en rojo: supera el tope de horas extra
        </div>
      </Tarjeta>
    </div>
  );
}
