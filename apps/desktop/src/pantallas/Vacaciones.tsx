import { useState } from 'react';
import { NOMBRE_CARGO, PARAMETROS_DEFECTO as P } from '@sgt/shared-types';
import { useEstado, useUsuario } from '../estado';
import { AHORA, PERSONAS } from '../datos/mock';
import { diaMes, fechaLocal, horas, sumarDias } from '../datos/fechas';
import { diasHabiles, fechaReintegro, saldoVacaciones } from '../datos/vacaciones';
import { Dato, Estado, Tarjeta } from '../componentes/Ui';

export function Vacaciones() {
  const usuario = useUsuario()!;
  const { solicitudes, crearSolicitud } = useEstado();
  const hoy = fechaLocal(AHORA);
  const [desde, setDesde] = useState(sumarDias(hoy, 30));
  const [hasta, setHasta] = useState(sumarDias(hoy, 44));
  const [enviada, setEnviada] = useState(false);

  const s = saldoVacaciones(usuario, solicitudes);
  const consume = desde <= hasta ? diasHabiles(desde, hasta) : 0;
  const anticipacion = (Date.parse(desde) - Date.parse(hoy)) / 86_400_000;
  const errores = [
    desde > hasta && 'La fecha final es anterior a la inicial.',
    anticipacion < P['vacaciones.anticipacion_min_dias'] && `Se requieren al menos ${P['vacaciones.anticipacion_min_dias']} días de anticipación (faltan ${anticipacion}).`,
    consume > s.disponibles && `El rango consume ${consume} días hábiles y tu saldo es ${s.disponibles}.`,
    s.puedeSolicitarDesde > hoy && `Podrás solicitar vacaciones desde el ${diaMes(s.puedeSolicitarDesde)} de ${s.puedeSolicitarDesde.slice(0, 4)}.`,
  ].filter(Boolean) as string[];

  const mias = solicitudes.filter((x) => x.solicitanteId === usuario.id && x.tipo === 'VACACIONES');

  return (
    <div className="pila">
      <div>
        <h2>Vacaciones</h2>
        <p className="sub">15 días hábiles por cada año de servicio. Días hábiles: lunes a sábado sin festivos (parámetro por confirmar con el cliente).</p>
      </div>
      {s.alertaAcumulacion && (
        <div className="alerta-caja aviso">Tienes más de un periodo de vacaciones acumulado. La ley exige concederlas dentro del año siguiente a su causación.</div>
      )}
      <div className="columnas c4">
        <Dato etiqueta="Días disponibles" valor={s.disponibles} nota={`${s.aniosServicio} años de servicio`} />
        <Dato etiqueta="Causados / disfrutados" valor={`${s.diasCausados} / ${s.diasDisfrutados}`} />
        <Dato etiqueta="Aprobados por disfrutar" valor={s.diasAprobadosPorDisfrutar} />
        <Dato etiqueta="Causación del año en curso" valor={`${horas(s.causacionProporcional)} días`} nota={s.puedeSolicitarDesde > hoy ? `Puedes solicitar desde ${s.puedeSolicitarDesde}` : 'Ya puedes solicitar'} />
      </div>

      <div className="columnas c2" style={{ alignItems: 'start' }}>
        <Tarjeta titulo="Simular y solicitar">
          <div className="pila">
            <div className="fila">
              <label>Desde<input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setEnviada(false); }} /></label>
              <label>Hasta<input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setEnviada(false); }} /></label>
            </div>
            <div className="columnas c2">
              <Dato etiqueta="Días hábiles que consume" valor={consume} />
              <Dato etiqueta="Fecha de reintegro" valor={desde <= hasta ? diaMes(fechaReintegro(hasta)) : '—'} />
            </div>
            {errores.map((e) => <div key={e} className="alerta-caja error">{e}</div>)}
            {enviada && <div className="alerta-caja info">Solicitud enviada. Puedes seguirla en Solicitudes.</div>}
            <button
              className="primario"
              disabled={errores.length > 0 || enviada}
              onClick={() => {
                crearSolicitud({ tipo: 'VACACIONES', solicitanteId: usuario.id, desde, hasta, comentario: `${consume} días hábiles` });
                setEnviada(true);
              }}
            >
              Solicitar vacaciones
            </button>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Mi historial">
          <table>
            <thead><tr><th>Rango</th><th className="num">Días</th><th>Estado</th></tr></thead>
            <tbody>
              {mias.map((x) => (
                <tr key={x.id}><td>{diaMes(x.desde!)} al {diaMes(x.hasta!)}</td><td className="num">{diasHabiles(x.desde!, x.hasta!)}</td><td><Estado valor={x.estado} /></td></tr>
              ))}
              {mias.length === 0 && <tr><td colSpan={3}>Sin solicitudes de vacaciones.</td></tr>}
            </tbody>
          </table>
        </Tarjeta>
      </div>

      {usuario.rol === 'COORDINADOR' && (
        <Tarjeta titulo="Saldos del equipo">
          <table>
            <thead>
              <tr><th>Persona</th><th>Cargo</th><th>Ingreso</th><th className="num">Causados</th><th className="num">Disfrutados</th><th className="num">Aprobados</th><th className="num">Disponibles</th><th /></tr>
            </thead>
            <tbody>
              {PERSONAS.map((p) => {
                const x = saldoVacaciones(p, solicitudes);
                return (
                  <tr key={p.id}>
                    <td>{p.nombres}</td><td>{NOMBRE_CARGO[p.cargo]}</td><td>{p.fechaIngreso}</td>
                    <td className="num">{x.diasCausados}</td><td className="num">{x.diasDisfrutados}</td>
                    <td className="num">{x.diasAprobadosPorDisfrutar}</td><td className="num"><b>{x.disponibles}</b></td>
                    <td>{x.alertaAcumulacion && <span className="pill amarillo">Periodos acumulados</span>}{x.aniosServicio < 1 && <span className="pill gris">Menos de 1 año</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </div>
  );
}
