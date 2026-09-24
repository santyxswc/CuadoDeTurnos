import { useState } from 'react';
import { NOMBRE_CARGO } from '@sgt/shared-types';
import { useEstado, useUsuario } from './estado';
import { AHORA } from './datos/mock';
import { fechaLarga, horaLocal } from './datos/fechas';
import { Login } from './pantallas/Login';
import { Inicio } from './pantallas/Inicio';
import { EditorCuadro } from './pantallas/EditorCuadro';
import { Solicitudes } from './pantallas/Solicitudes';
import { Aptos } from './pantallas/Aptos';
import { MisHoras } from './pantallas/MisHoras';
import { Vacaciones } from './pantallas/Vacaciones';
import { Pacientes } from './pantallas/Pacientes';
import { Administracion } from './pantallas/Administracion';

type Ruta = 'inicio' | 'editor' | 'solicitudes' | 'aptos' | 'horas' | 'vacaciones' | 'pacientes' | 'admin';

const MENU: { ruta: Ruta; texto: string; soloCoordinador?: boolean }[] = [
  { ruta: 'inicio', texto: 'Página principal' },
  { ruta: 'editor', texto: 'Editor de cuadro', soloCoordinador: true },
  { ruta: 'solicitudes', texto: 'Solicitudes' },
  { ruta: 'aptos', texto: 'Filtro de aptos' },
  { ruta: 'horas', texto: 'Horas y recargos' },
  { ruta: 'vacaciones', texto: 'Vacaciones' },
  { ruta: 'pacientes', texto: 'Pacientes atendidos' },
  { ruta: 'admin', texto: 'Administración', soloCoordinador: true },
];

export function App() {
  const usuario = useUsuario();
  const { cerrarSesion, solicitudes } = useEstado();
  const [ruta, setRuta] = useState<Ruta>('inicio');

  if (!usuario) return <Login />;

  const esCoordinador = usuario.rol === 'COORDINADOR';
  const pendientes = solicitudes.filter((s) =>
    esCoordinador
      ? s.estado === 'PENDIENTE_COORDINADOR'
      : s.estado === 'PENDIENTE_COMPANERO' && s.companeroId === usuario.id,
  ).length;

  const pantalla = {
    inicio: <Inicio />,
    editor: <EditorCuadro />,
    solicitudes: <Solicitudes />,
    aptos: <Aptos />,
    horas: <MisHoras />,
    vacaciones: <Vacaciones />,
    pacientes: <Pacientes />,
    admin: <Administracion />,
  }[ruta];

  return (
    <div className="app">
      <aside className="menu">
        <div className="marca">
          Turno<b>Care</b>
        </div>
        <nav>
          {MENU.filter((m) => !m.soloCoordinador || esCoordinador).map((m) => (
            <button key={m.ruta} className={ruta === m.ruta ? 'activo' : ''} onClick={() => setRuta(m.ruta)}>
              {m.texto}
              {m.ruta === 'solicitudes' && pendientes > 0 && <span className="contador">{pendientes}</span>}
            </button>
          ))}
        </nav>
        <div className="sesion">
          <div className="avatar">{usuario.nombres[0]}</div>
          <div>
            <b>{usuario.nombres}</b>
            <small>
              {esCoordinador ? 'Coordinador/a' : 'Enfermero/a'} · {NOMBRE_CARGO[usuario.cargo]}
            </small>
          </div>
          <button className="enlace" onClick={() => { cerrarSesion(); setRuta('inicio'); }}>
            Salir
          </button>
        </div>
      </aside>
      <main className="contenido">
        <div className="aviso-prototipo">
          Prototipo navegable · datos de ejemplo · hora simulada: {fechaLarga(AHORA)}, {horaLocal(AHORA)}
        </div>
        {pantalla}
      </main>
    </div>
  );
}
