import { useState } from 'react';
import { NOMBRE_CARGO, PARAMETROS_DEFECTO } from '@sgt/shared-types';
import { useEstado } from '../estado';
import { FESTIVOS, PERSONAS, TIPOS_TURNO } from '../datos/mock';
import { diaMes, pesos } from '../datos/fechas';
import { Chip, Tarjeta } from '../componentes/Ui';

type Pestana = 'usuarios' | 'turnos' | 'parametros' | 'festivos' | 'auditoria';

export function Administracion() {
  const [pestana, setPestana] = useState<Pestana>('usuarios');
  const { auditoria, versionCuadro } = useEstado();
  const smmlv = PARAMETROS_DEFECTO['nomina.smmlv'];

  return (
    <div className="pila">
      <div>
        <h2>Administración</h2>
        <p className="sub">Personal, tipos de turno, parámetros laborales con vigencia, festivos y auditoría.</p>
      </div>
      <div className="pestanas">
        {(['usuarios', 'turnos', 'parametros', 'festivos', 'auditoria'] as Pestana[]).map((p) => (
          <button key={p} className={pestana === p ? 'activo' : ''} onClick={() => setPestana(p)}>
            {{ usuarios: 'Personal', turnos: 'Tipos de turno', parametros: 'Parámetros', festivos: 'Festivos', auditoria: 'Auditoría' }[p]}
          </button>
        ))}
      </div>

      {pestana === 'usuarios' && (
        <Tarjeta titulo={`Personal (${PERSONAS.length})`} acciones={<button className="primario">+ Nuevo usuario</button>}>
          <table>
            <thead>
              <tr><th>Nombre</th><th>Documento</th><th>Rol en la app</th><th>Cargo</th><th className="num">Salario base</th><th>Ingreso</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {PERSONAS.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombres}</td>
                  <td>{p.documento}</td>
                  <td>{p.rol === 'COORDINADOR' ? 'Coordinador/a' : 'Enfermero/a'}</td>
                  <td>{NOMBRE_CARGO[p.cargo]}</td>
                  <td className="num">
                    {pesos(p.salario)}
                    {p.salario < smmlv && <div><span className="pill rojo" title={`Inferior al SMMLV de referencia (${pesos(smmlv)})`}>Menor al mínimo</span></div>}
                  </td>
                  <td>{p.fechaIngreso}</td>
                  <td><span className="pill verde">Activo</span></td>
                  <td><button className="enlace">Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sub" style={{ marginTop: 10 }}>Los usuarios nunca se borran: se desactivan para conservar el historial (RF-AUT-03).</p>
        </Tarjeta>
      )}

      {pestana === 'turnos' && (
        <Tarjeta titulo="Tipos de turno" acciones={<button className="primario">+ Nuevo tipo</button>}>
          <table>
            <thead><tr><th>Código</th><th>Nombre</th><th>Inicio</th><th>Fin</th><th className="num">Duración</th></tr></thead>
            <tbody>
              {TIPOS_TURNO.map((t) => {
                const [hi, mi] = t.horaInicio.split(':').map(Number);
                const [hf, mf] = t.horaFin.split(':').map(Number);
                const dur = ((hf * 60 + mf - (hi * 60 + mi) + 1440) % 1440 || 1440) / 60;
                return (
                  <tr key={t.codigo}><td><Chip codigo={t.codigo} /></td><td>{t.nombre}</td><td>{t.horaInicio}</td><td>{t.horaFin}</td><td className="num">{dur} h</td></tr>
                );
              })}
            </tbody>
          </table>
          <p className="sub" style={{ marginTop: 10 }}>Horarios propuestos: el cliente debe confirmar los turnos reales el 30-sep.</p>
        </Tarjeta>
      )}

      {pestana === 'parametros' && (
        <Tarjeta titulo="Parámetros laborales">
          <table>
            <thead><tr><th>Clave</th><th>Valor</th><th>Vigente desde</th></tr></thead>
            <tbody>
              {Object.entries(PARAMETROS_DEFECTO).map(([k, v]) => (
                <tr key={k}><td><code>{k}</code></td><td>{String(v)}</td><td>{k === 'recargo.dominical_pct' || k === 'jornada.maxima_semanal_h' ? '2026-07-15' : k === 'jornada.inicio_nocturna' ? '2025-12-25' : '2026-01-01'}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="sub" style={{ marginTop: 10 }}>Cada cambio crea una nueva vigencia; los cálculos usan el valor vigente en la fecha trabajada (ADR-004).</p>
        </Tarjeta>
      )}

      {pestana === 'festivos' && (
        <Tarjeta titulo="Festivos de Colombia 2026">
          <table>
            <thead><tr><th>Fecha</th><th>Festivo</th></tr></thead>
            <tbody>
              {Object.entries(FESTIVOS).map(([f, n]) => <tr key={f}><td>{diaMes(f)} {f.slice(0, 4)}</td><td>{n}</td></tr>)}
            </tbody>
          </table>
        </Tarjeta>
      )}

      {pestana === 'auditoria' && (
        <Tarjeta titulo={`Auditoría de esta sesión · cuadro de octubre en versión ${versionCuadro}`}>
          {auditoria.length === 0 ? (
            <p className="sub">Aún no hay acciones. Marca una entrada, aprueba una solicitud o consulta datos de un paciente para verlas aquí.</p>
          ) : (
            <ul>{auditoria.map((a, i) => <li key={i}>{a}</li>)}</ul>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
