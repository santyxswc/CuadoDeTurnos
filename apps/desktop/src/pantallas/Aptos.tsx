import { useMemo, useState } from 'react';
import { useEstado, useUsuario } from '../estado';
import { AHORA, PERSONAS, TIPOS_TURNO, crearAsignacion } from '../datos/mock';
import { diaMes, fechaLocal, horas } from '../datos/fechas';
import { aptitudPara } from '../datos/reglas';
import { Chip, Estado, Tarjeta } from '../componentes/Ui';

const GRUPOS = ['APTO', 'APTO_CON_ADVERTENCIA', 'NO_APTO'] as const;

export function Aptos() {
  const usuario = useUsuario()!;
  const { asignaciones, solicitudes } = useEstado();
  const esCoordinador = usuario.rol === 'COORDINADOR';
  // Por defecto, el primer turno que quedó sin cobertura.
  const pendiente = asignaciones.find((a) => a.estado === 'LIBERADA' && a.inicio > AHORA);
  const [fecha, setFecha] = useState(pendiente?.fecha ?? fechaLocal(AHORA));
  const [codigo, setCodigo] = useState(pendiente?.codigo ?? 'N');

  const turno = useMemo(() => crearAsignacion('-', fecha, codigo), [fecha, codigo]);
  const resultados = useMemo(
    () =>
      PERSONAS.map((p) => ({ p, r: aptitudPara(p.id, turno, asignaciones, solicitudes) }))
        // RF-APT-02: menor carga primero.
        .sort((a, b) => a.r.horasSemana - b.r.horasSemana),
    [turno, asignaciones, solicitudes],
  );
  const liberados = asignaciones.filter((a) => a.estado === 'LIBERADA' && a.inicio > AHORA);

  return (
    <div className="pila">
      <div>
        <h2>Filtro de aptos</h2>
        <p className="sub">
          Para un turno dado, clasifica al personal según descanso, horas en la semana, noches seguidas, vacaciones y cruces.
          {!esCoordinador && ' Como enfermero/a ves la clasificación y el motivo, sin las horas de tus compañeros.'}
        </p>
      </div>
      <Tarjeta titulo="Turno a cubrir">
        <div className="fila">
          <label>Fecha<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
          <label>
            Turno
            <select value={codigo} onChange={(e) => setCodigo(e.target.value)}>
              {TIPOS_TURNO.map((t) => <option key={t.codigo} value={t.codigo}>{t.codigo} · {t.nombre} {t.horaInicio}–{t.horaFin}</option>)}
            </select>
          </label>
          <div style={{ flex: 2 }}>
            <small style={{ color: 'var(--suave)' }}>Turnos que requieren cobertura:</small>
            <div className="fila" style={{ marginTop: 4 }}>
              {liberados.slice(0, 6).map((a) => (
                <button key={a.id} onClick={() => { setFecha(a.fecha); setCodigo(a.codigo); }}>
                  <Chip codigo={a.codigo} /> {diaMes(a.fecha)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Tarjeta>
      <div className="columnas c3">
        {GRUPOS.map((g) => {
          const lista = resultados.filter((x) => x.r.clasificacion === g);
          return (
            <Tarjeta key={g} titulo={<><Estado valor={g} /> {lista.length}</>}>
              <ul className="limpia indicadores">
                {lista.map(({ p, r }) => (
                  <li key={p.id}>
                    <div>
                      {p.nombres}
                      {r.motivos.length > 0 && (
                        <ul className="motivos">
                          {(esCoordinador ? r.motivos : r.motivos.map((m) => m.replace(/\d+(,\d+)?(\.\d+)? h/g, '… h'))).map((m) => <li key={m}>{m}</li>)}
                        </ul>
                      )}
                    </div>
                    {esCoordinador && <small title="Horas programadas en la semana, incluyendo este turno">{horas(r.horasSemana)} h</small>}
                  </li>
                ))}
                {lista.length === 0 && <li><small>Nadie en este grupo</small></li>}
              </ul>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
