import { useState } from 'react';
import type { EstadoEgreso, TipoDocumento } from '@sgt/shared-types';
import { useEstado, useUsuario } from '../estado';
import { AHORA, DIAGNOSTICOS_CIE10, ESTADOS_EGRESO, PERSONAS, persona } from '../datos/mock';
import { diaMes, horaLocal } from '../datos/fechas';
import { Chip, Tarjeta } from '../componentes/Ui';

const enmascarar = (v: string) => `••••${v.slice(-4)}`;

export function Pacientes() {
  const usuario = useUsuario()!;
  const { asignaciones, marcaciones, pacientes, registrarPaciente, verDatoSensible } = useEstado();
  const esCoordinador = usuario.rol === 'COORDINADOR';

  // Turnos propios en los que marcó entrada (el actual o los recientes).
  const misTurnos = asignaciones
    .filter((a) => a.usuarioId === usuario.id && marcaciones[a.id]?.entrada && a.inicio <= AHORA)
    .sort((a, b) => b.inicio.getTime() - a.inicio.getTime())
    .slice(0, 5);

  const [asignacionId, setAsignacionId] = useState(misTurnos[0]?.id ?? '');
  const vacio = { nombre: '', tipoDocumento: 'CC' as TipoDocumento, documento: '', cie10: 'I10X', telefono: '', estadoEgreso: 'CONTINUA_HOSPITALIZADO' as EstadoEgreso };
  const [form, setForm] = useState(vacio);
  const [visibles, setVisibles] = useState<Record<string, boolean>>({});

  // RNF-14: el detalle solo lo ven quien registró y el coordinador.
  const lista = pacientes.filter((p) => esCoordinador || p.usuarioId === usuario.id);
  const valido = asignacionId && form.nombre.trim() && /^\d{5,12}$/.test(form.documento) && (!form.telefono || /^\d{7,10}$/.test(form.telefono));

  return (
    <div className="pila">
      <div>
        <h2>Pacientes atendidos</h2>
        <p className="sub">Registro por turno de los pacientes atendidos.</p>
      </div>
      <div className="alerta-caja aviso">
        <b>Datos sensibles de salud (Ley 1581 de 2012).</b> Este módulo registra nombre, documento, diagnóstico, teléfono y estado de egreso, como pidió el cliente.
        En la versión final el documento, el teléfono y el diagnóstico se guardan cifrados y cada consulta queda auditada. <b>Pendiente de aprobación escrita del cliente (ADR-009).</b>
      </div>

      <div className="columnas c2" style={{ alignItems: 'start' }}>
        <Tarjeta titulo="Registrar paciente">
          {misTurnos.length === 0 ? (
            <p className="sub">No tienes turnos con entrada marcada para registrar pacientes.</p>
          ) : (
            <form
              className="pila"
              onSubmit={(e) => {
                e.preventDefault();
                if (!valido) return;
                registrarPaciente({ ...form, usuarioId: usuario.id, asignacionId });
                setForm(vacio);
              }}
            >
              <label>
                Turno
                <select value={asignacionId} onChange={(e) => setAsignacionId(e.target.value)}>
                  {misTurnos.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {diaMes(a.fecha)} {horaLocal(a.inicio)}–{horaLocal(a.fin)}</option>)}
                </select>
              </label>
              <label>Nombre completo<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
              <div className="fila">
                <label style={{ maxWidth: 110 }}>
                  Tipo doc.
                  <select value={form.tipoDocumento} onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value as TipoDocumento })}>
                    {['CC', 'TI', 'RC', 'CE', 'PA', 'PPT'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label>Número de documento<input inputMode="numeric" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value.replace(/\D/g, '') })} /></label>
                <label>Teléfono<input inputMode="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') })} /></label>
              </div>
              <label>
                Diagnóstico (CIE-10)
                <select value={form.cie10} onChange={(e) => setForm({ ...form, cie10: e.target.value })}>
                  {Object.entries(DIAGNOSTICOS_CIE10).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
                </select>
              </label>
              <label>
                Estado de egreso
                <select value={form.estadoEgreso} onChange={(e) => setForm({ ...form, estadoEgreso: e.target.value as EstadoEgreso })}>
                  {Object.entries(ESTADOS_EGRESO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <button className="primario" type="submit" disabled={!valido}>Registrar</button>
            </form>
          )}
        </Tarjeta>

        <div className="pila">
          {esCoordinador && (
            <Tarjeta titulo="Pacientes por persona (octubre)">
              <table>
                <thead><tr><th>Persona</th><th className="num">Pacientes</th><th className="num">Turnos</th><th className="num">Promedio</th></tr></thead>
                <tbody>
                  {PERSONAS.map((p) => {
                    const suyos = pacientes.filter((x) => x.usuarioId === p.id);
                    const turnos = new Set(suyos.map((x) => x.asignacionId)).size;
                    return (
                      <tr key={p.id}>
                        <td>{p.nombres}</td><td className="num">{suyos.length}</td><td className="num">{turnos}</td>
                        <td className="num">{turnos ? (suyos.length / turnos).toFixed(1).replace('.', ',') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Tarjeta>
          )}
          <Tarjeta titulo={esCoordinador ? 'Registros del equipo' : 'Mis registros'}>
            <table>
              <thead><tr><th style={{ whiteSpace: 'nowrap' }}>Turno</th><th>Paciente</th><th>Documento</th><th>Dx</th><th>Teléfono</th><th>Egreso</th><th /></tr></thead>
              <tbody>
                {lista.map((p) => {
                  const a = asignaciones.find((x) => x.id === p.asignacionId);
                  const ver = visibles[p.id];
                  return (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{a && <><Chip codigo={a.codigo} /> {diaMes(a.fecha)}</>}{esCoordinador && <div><small>{persona(p.usuarioId).nombres}</small></div>}</td>
                      <td>{p.nombre}</td>
                      <td>{p.tipoDocumento} {ver ? p.documento : enmascarar(p.documento)}</td>
                      <td title={DIAGNOSTICOS_CIE10[p.cie10]}>{ver ? p.cie10 : '•••'}</td>
                      <td>{p.telefono ? (ver ? p.telefono : enmascarar(p.telefono)) : '—'}</td>
                      <td>{ESTADOS_EGRESO[p.estadoEgreso]}</td>
                      <td>
                        {!ver && (
                          <button className="enlace" onClick={() => { verDatoSensible(p.id); setVisibles({ ...visibles, [p.id]: true }); }}>
                            Ver
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {lista.length === 0 && <tr><td colSpan={7}>Sin registros.</td></tr>}
              </tbody>
            </table>
            <small style={{ color: 'var(--suave)' }}>Al pulsar "Ver" la consulta queda registrada en la auditoría.</small>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
