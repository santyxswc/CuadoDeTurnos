import { useMemo, useState } from 'react';
import { estadoTurno } from '@sgt/rules-engine';
import { useEstado, useUsuario } from '../estado';
import { AHORA, FESTIVOS, PERSONAS, persona, tipoTurno } from '../datos/mock';
import { diaMes, diaSemana, encabezadoDia, fechaLocal, horaLocal, horas, lunesDe, rangoFechas, sumarDias } from '../datos/fechas';
import { PARAMETROS_ASISTENCIA, duracionH } from '../datos/reglas';
import { saldoVacaciones } from '../datos/vacaciones';
import { Chip, Dato, Estado, Tarjeta } from '../componentes/Ui';
import { PARAMETROS_DEFECTO } from '@sgt/shared-types';

const VENTANA_MS = PARAMETROS_DEFECTO['asistencia.ventana_asociacion_h'] * 3_600_000;

export function Inicio() {
  const usuario = useUsuario()!;
  const { asignaciones, marcaciones, marcar, solicitudes } = useEstado();
  const hoy = fechaLocal(AHORA);
  const [lunes, setLunes] = useState(lunesDe(hoy));
  const dias = rangoFechas(lunes, sumarDias(lunes, 6));

  const celda = (usuarioId: string, fecha: string) =>
    asignaciones.find((a) => a.usuarioId === usuarioId && a.fecha === fecha);

  // Turnos alrededor de la hora actual: en curso, recién terminados o por empezar.
  const actuales = useMemo(
    () =>
      asignaciones
        .filter((a) => a.estado === 'ACTIVA' && a.inicio.getTime() - VENTANA_MS <= AHORA.getTime() && a.fin.getTime() + VENTANA_MS >= AHORA.getTime())
        .sort((a, b) => a.inicio.getTime() - b.inicio.getTime()),
    [asignaciones],
  );

  const miTurno = actuales.find((a) => a.usuarioId === usuario.id);
  const miMarca = miTurno ? marcaciones[miTurno.id] : undefined;

  const mias = asignaciones.filter((a) => a.usuarioId === usuario.id && a.estado === 'ACTIVA');
  const proximas = mias.filter((a) => a.inicio > AHORA).slice(0, 3);
  const horasMes = mias.filter((a) => a.fecha.startsWith('2026-10') && a.fin <= AHORA).reduce((s, a) => s + duracionH(a), 0);
  const misPendientes = solicitudes.filter((s) => s.solicitanteId === usuario.id && s.estado.startsWith('PENDIENTE')).length;

  return (
    <div className="pila">
      <div className="marcacion">
        <div className="espaciador">
          <small>{miTurno ? `Tu turno: ${tipoTurno(miTurno.codigo).nombre} ${horaLocal(miTurno.inicio)}–${horaLocal(miTurno.fin)}` : 'No tienes turno en este momento'}</small>
          <h2>
            {miMarca?.salida
              ? `Salida registrada a las ${horaLocal(miMarca.salida)}`
              : miMarca?.entrada
                ? `En turno desde las ${horaLocal(miMarca.entrada)}`
                : miTurno
                  ? 'Aún no has marcado tu entrada'
                  : 'Buen día'}
          </h2>
          <small>La hora que se registra es la del servidor, no la de este equipo.</small>
        </div>
        {miTurno && !miMarca?.salida && (
          <button className="grande" onClick={() => marcar(miTurno.id)}>
            {miMarca?.entrada ? 'Marcar salida' : 'Marcar entrada'}
          </button>
        )}
      </div>

      <div className="columnas c4">
        <Dato etiqueta="Próximo turno" valor={proximas[0] ? `${proximas[0].codigo} · ${diaMes(proximas[0].fecha)}` : '—'} nota={proximas.slice(1).map((a) => `${a.codigo} ${diaMes(a.fecha)}`).join(' · ')} />
        <Dato etiqueta="Horas trabajadas en octubre" valor={horas(horasMes)} nota="Según marcaciones" />
        <Dato etiqueta="Saldo de vacaciones" valor={`${saldoVacaciones(usuario, solicitudes).disponibles} días`} nota="Ver detalle en Vacaciones" />
        <Dato etiqueta="Mis solicitudes pendientes" valor={misPendientes} />
      </div>

      <div className="columnas principal">
        <Tarjeta
          titulo="Cuadro de turnos · octubre 2026"
          acciones={
            <>
              <Estado valor="PUBLICADO" />
              <button onClick={() => setLunes(sumarDias(lunes, -7))}>‹ Semana anterior</button>
              <button onClick={() => setLunes(lunesDe(hoy))}>Hoy</button>
              <button onClick={() => setLunes(sumarDias(lunes, 7))}>Semana siguiente ›</button>
            </>
          }
        >
          <div className="desplazable">
            <table className="cuadro">
              <thead>
                <tr>
                  <th className="nombre">Semana del {diaMes(lunes)}</th>
                  {dias.map((d) => (
                    <th key={d} className={[d === hoy && 'hoy', d in FESTIVOS && 'festivo', diaSemana(d) === 0 && 'domingo'].filter(Boolean).join(' ')} title={FESTIVOS[d]}>
                      {encabezadoDia(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERSONAS.map((p) => (
                  <tr key={p.id} className={p.id === usuario.id ? 'yo' : ''}>
                    <td className="nombre">{p.nombres}</td>
                    {dias.map((d) => {
                      const a = celda(p.id, d);
                      return (
                        <td key={d} className={d === hoy ? 'hoy' : ''}>
                          {a && <Chip codigo={a.codigo} tachado={a.estado === 'LIBERADA'} />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="leyenda" style={{ marginTop: 10 }}>
            <Chip codigo="M" /> Mañana 07–13 <Chip codigo="T" /> Tarde 13–19 <Chip codigo="N" /> Noche 19–07 <Chip codigo="D" /> Día largo 07–19
            <Chip codigo="N" tachado /> Requiere cobertura
            <span>· Solo lectura. Solo el coordinador puede modificar el cuadro.</span>
          </div>
        </Tarjeta>

        <div className="pila">
          <Tarjeta titulo="Estado del turno actual">
            <ul className="limpia indicadores">
              {actuales.map((a) => {
                const m = marcaciones[a.id] ?? {};
                const estado = estadoTurno({ inicio: a.inicio, fin: a.fin, ...m }, AHORA, PARAMETROS_ASISTENCIA);
                return (
                  <li key={a.id}>
                    <div>
                      {persona(a.usuarioId).nombres}
                      <small>
                        <Chip codigo={a.codigo} /> {horaLocal(a.inicio)}–{horaLocal(a.fin)}
                        {m.entrada && ` · entró ${horaLocal(m.entrada)}`}
                        {m.salida && ` · salió ${horaLocal(m.salida)}`}
                      </small>
                    </div>
                    <Estado valor={estado} />
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
          <Chat />
        </div>
      </div>
    </div>
  );
}

function Chat() {
  const usuario = useUsuario()!;
  const { mensajes, enviarMensaje } = useEstado();
  const [texto, setTexto] = useState('');
  const [novedad, setNovedad] = useState(false);
  const [soloNovedades, setSoloNovedades] = useState(false);

  const visibles = soloNovedades ? mensajes.filter((m) => m.esNovedad) : mensajes;

  return (
    <Tarjeta
      titulo="Chat del equipo"
      className="chat"
      acciones={
        <label className="check">
          <input type="checkbox" checked={soloNovedades} onChange={(e) => setSoloNovedades(e.target.checked)} /> Solo novedades
        </label>
      }
    >
      <div className="mensajes">
        {visibles.map((m) => (
          <div key={m.id} className={['mensaje', m.autorId === usuario.id && 'mio', m.esNovedad && 'novedad', !m.autorId && 'sistema'].filter(Boolean).join(' ')}>
            <header>
              <b>{m.autorId ? persona(m.autorId).nombres : 'Sistema'}</b>
              <span>{horaLocal(m.hora)}</span>
              {m.esNovedad && <span className="pill naranja">Novedad</span>}
            </header>
            {m.contenido}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          enviarMensaje(texto.trim(), novedad);
          setTexto('');
          setNovedad(false);
        }}
      >
        <textarea rows={2} placeholder="Escribe un mensaje para el equipo…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <div className="fila">
          <label className="check">
            <input type="checkbox" checked={novedad} onChange={(e) => setNovedad(e.target.checked)} /> Marcar como novedad
          </label>
          <span className="espaciador" />
          <button className="primario" type="submit">Enviar</button>
        </div>
      </form>
    </Tarjeta>
  );
}
