import { useState } from 'react';
import type { CategoriaPermiso, TipoSolicitud } from '@sgt/shared-types';
import { useEstado, useUsuario } from '../estado';
import { AHORA, CATEGORIAS_PERMISO, PERSONAS, persona, type Solicitud } from '../datos/mock';
import { diaMes, fechaLocal, horaLocal, sumarDias } from '../datos/fechas';
import { aptitudPara } from '../datos/reglas';
import { Chip, Estado, Tarjeta } from '../componentes/Ui';

const TIPOS: Record<TipoSolicitud, string> = {
  INTERCAMBIO: 'Intercambio de turno',
  CESION: 'Cesión de turno',
  PERMISO: 'Permiso',
  VACACIONES: 'Vacaciones',
};

export function Solicitudes() {
  const [pestana, setPestana] = useState<'bandeja' | 'nueva'>('bandeja');
  return (
    <div className="pila">
      <div>
        <h2>Solicitudes</h2>
        <p className="sub">Intercambios, cesiones y permisos. En intercambios y cesiones el compañero acepta primero y luego decide el coordinador.</p>
      </div>
      <div className="pestanas">
        <button className={pestana === 'bandeja' ? 'activo' : ''} onClick={() => setPestana('bandeja')}>Bandeja</button>
        <button className={pestana === 'nueva' ? 'activo' : ''} onClick={() => setPestana('nueva')}>Nueva solicitud</button>
      </div>
      {pestana === 'bandeja' ? <Bandeja /> : <Nueva alTerminar={() => setPestana('bandeja')} />}
    </div>
  );
}

function detalle(s: Solicitud, asignacion?: { codigo: string; fecha: string }, destino?: { codigo: string; fecha: string }) {
  if (asignacion)
    return (
      <>
        <Chip codigo={asignacion.codigo} /> {diaMes(asignacion.fecha)} → {persona(s.companeroId!).nombres}
        {destino && (
          <>
            {' '}· a cambio de <Chip codigo={destino.codigo} /> {diaMes(destino.fecha)}
          </>
        )}
      </>
    );
  const rango = s.desde === s.hasta ? diaMes(s.desde!) : `${diaMes(s.desde!)} al ${diaMes(s.hasta!)}`;
  return `${rango}${s.categoria ? ` · ${CATEGORIAS_PERMISO[s.categoria]}` : ''}`;
}

function Bandeja() {
  const usuario = useUsuario()!;
  const { solicitudes, asignaciones, resolverSolicitud, responderCompanero, cancelarSolicitud } = useEstado();
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const esCoordinador = usuario.rol === 'COORDINADOR';

  const visibles = solicitudes
    .filter((s) => esCoordinador || s.solicitanteId === usuario.id || s.companeroId === usuario.id)
    .filter((s) => !tipo || s.tipo === tipo)
    .filter((s) => !estado || s.estado === estado);

  return (
    <Tarjeta
      titulo={esCoordinador ? 'Todas las solicitudes del equipo' : 'Mis solicitudes'}
      acciones={
        <>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="PENDIENTE_COMPANERO">Pendiente de compañero</option>
            <option value="PENDIENTE_COORDINADOR">Pendiente de coordinador</option>
            <option value="APLICADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </>
      }
    >
      <table>
        <thead>
          <tr>
            <th>Creada</th>
            <th>Tipo</th>
            <th>Solicitante</th>
            <th>Detalle</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((s) => {
            const a = asignaciones.find((x) => x.id === s.asignacionId);
            const d = asignaciones.find((x) => x.id === s.asignacionDestinoId);
            const puedeResolver = esCoordinador && s.estado === 'PENDIENTE_COORDINADOR';
            const puedeResponder = s.estado === 'PENDIENTE_COMPANERO' && s.companeroId === usuario.id;
            const puedeCancelar = s.solicitanteId === usuario.id && s.estado.startsWith('PENDIENTE');
            return (
              <tr key={s.id}>
                <td>{diaMes(fechaLocal(s.creada))} {horaLocal(s.creada)}</td>
                <td>{TIPOS[s.tipo]}</td>
                <td>{persona(s.solicitanteId).nombres}</td>
                <td>
                  {detalle(s, a, d)}
                  {s.comentario && <div><small>{s.comentario}</small></div>}
                  {s.resolucion && <div><small><b>Respuesta:</b> {s.resolucion}</small></div>}
                </td>
                <td>
                  <Estado valor={s.estado} />
                  {s.autoaprobada && <div><small>Anotación del coordinador</small></div>}
                </td>
                <td>
                  {puedeResolver && (
                    <div className="pila" style={{ gap: 6 }}>
                      <input placeholder="Comentario" value={comentarios[s.id] ?? ''} onChange={(e) => setComentarios({ ...comentarios, [s.id]: e.target.value })} />
                      <div className="fila">
                        <button className="primario" onClick={() => resolverSolicitud(s.id, true, comentarios[s.id] || 'Aprobado')}>Aprobar</button>
                        <button className="peligro" onClick={() => resolverSolicitud(s.id, false, comentarios[s.id] || 'Rechazado')}>Rechazar</button>
                      </div>
                    </div>
                  )}
                  {puedeResponder && (
                    <div className="fila">
                      <button className="primario" onClick={() => responderCompanero(s.id, true)}>Aceptar</button>
                      <button className="peligro" onClick={() => responderCompanero(s.id, false)}>Rechazar</button>
                    </div>
                  )}
                  {puedeCancelar && !puedeResponder && <button onClick={() => cancelarSolicitud(s.id)}>Cancelar</button>}
                </td>
              </tr>
            );
          })}
          {visibles.length === 0 && (
            <tr><td colSpan={6} style={{ color: 'var(--suave)' }}>No hay solicitudes con esos filtros.</td></tr>
          )}
        </tbody>
      </table>
    </Tarjeta>
  );
}

function Nueva({ alTerminar }: { alTerminar: () => void }) {
  const usuario = useUsuario()!;
  const { asignaciones, solicitudes, crearSolicitud } = useEstado();
  const [tipo, setTipo] = useState<TipoSolicitud>('CESION');
  const [asignacionId, setAsignacionId] = useState('');
  const [companeroId, setCompaneroId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [categoria, setCategoria] = useState<CategoriaPermiso>('PERSONAL');
  const hoy = fechaLocal(AHORA);
  const [desde, setDesde] = useState(sumarDias(hoy, 2));
  const [hasta, setHasta] = useState(sumarDias(hoy, 2));
  const [comentario, setComentario] = useState('');

  const mias = asignaciones.filter((a) => a.usuarioId === usuario.id && a.estado === 'ACTIVA' && a.inicio > AHORA);
  const origen = mias.find((a) => a.id === asignacionId);
  const turnosCompanero = asignaciones.filter((a) => a.usuarioId === companeroId && a.estado === 'ACTIVA' && a.inicio > AHORA);
  const destino = turnosCompanero.find((a) => a.id === destinoId);

  // RF-SOL-03: se valida la aptitud antes de enviar (el compañero toma mi turno; en intercambio, yo tomo el suyo).
  const aptCompanero = origen && companeroId ? aptitudPara(companeroId, origen, asignaciones, solicitudes, destino ? [destino.id] : []) : null;
  const aptYo = tipo === 'INTERCAMBIO' && destino ? aptitudPara(usuario.id, destino, asignaciones, solicitudes, origen ? [origen.id] : []) : null;
  const bloqueado = aptCompanero?.clasificacion === 'NO_APTO' || aptYo?.clasificacion === 'NO_APTO';

  const conCompanero = tipo === 'INTERCAMBIO' || tipo === 'CESION';
  const listo = conCompanero ? !!origen && !!companeroId && (tipo === 'CESION' || !!destino) && !bloqueado : desde <= hasta;

  return (
    <Tarjeta titulo="Nueva solicitud">
      <div className="pila">
        <div className="fila">
          <label>
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoSolicitud)}>
              <option value="CESION">Cesión (un compañero toma mi turno)</option>
              <option value="INTERCAMBIO">Intercambio (cambiamos turnos)</option>
              <option value="PERMISO">Permiso</option>
            </select>
          </label>
          <div className="alerta-caja info" style={{ flex: 2 }}>Las vacaciones se solicitan desde la pantalla Vacaciones, donde ves tu saldo y los días hábiles.</div>
        </div>

        {conCompanero ? (
          <>
            <div className="fila">
              <label>
                Mi turno
                <select value={asignacionId} onChange={(e) => setAsignacionId(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {mias.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {diaMes(a.fecha)} {horaLocal(a.inicio)}–{horaLocal(a.fin)}</option>)}
                </select>
              </label>
              <label>
                Compañero
                <select value={companeroId} onChange={(e) => { setCompaneroId(e.target.value); setDestinoId(''); }}>
                  <option value="">Selecciona…</option>
                  {PERSONAS.filter((p) => p.id !== usuario.id).map((p) => <option key={p.id} value={p.id}>{p.nombres}</option>)}
                </select>
              </label>
              {tipo === 'INTERCAMBIO' && (
                <label>
                  Turno del compañero que tomo a cambio
                  <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} disabled={!companeroId}>
                    <option value="">Selecciona…</option>
                    {turnosCompanero.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {diaMes(a.fecha)}</option>)}
                  </select>
                </label>
              )}
            </div>
            {aptCompanero && <ResultadoApt quien={persona(companeroId).nombres} r={aptCompanero} />}
            {aptYo && <ResultadoApt quien="Tú" r={aptYo} />}
          </>
        ) : (
          <div className="fila">
            <label>
              Motivo
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaPermiso)}>
                {Object.entries(CATEGORIAS_PERMISO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
            <label>Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
          </div>
        )}
        <label>
          Comentario (opcional; no escribas diagnósticos)
          <input value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </label>
        {usuario.rol === 'COORDINADOR' && !conCompanero && (
          <div className="alerta-caja aviso">Como coordinador/a, tu solicitud no requiere aprobación: queda aplicada y registrada como constancia.</div>
        )}
        <div className="fila">
          <span className="espaciador" />
          <button
            className="primario"
            disabled={!listo}
            onClick={() => {
              crearSolicitud(
                conCompanero
                  ? { tipo, solicitanteId: usuario.id, companeroId, asignacionId, asignacionDestinoId: destinoId || undefined, comentario }
                  : { tipo, solicitanteId: usuario.id, desde, hasta, categoria, comentario },
              );
              alTerminar();
            }}
          >
            Enviar solicitud
          </button>
        </div>
      </div>
    </Tarjeta>
  );
}

function ResultadoApt({ quien, r }: { quien: string; r: ReturnType<typeof aptitudPara> }) {
  const clase = r.clasificacion === 'NO_APTO' ? 'error' : r.clasificacion === 'APTO' ? 'info' : 'aviso';
  return (
    <div className={`alerta-caja ${clase}`}>
      <b>{quien}:</b> <Estado valor={r.clasificacion} />
      {r.motivos.length > 0 && <ul className="motivos">{r.motivos.map((m) => <li key={m}>{m}</li>)}</ul>}
      {r.clasificacion === 'NO_APTO' && <div>No se puede enviar la solicitud.</div>}
    </div>
  );
}
