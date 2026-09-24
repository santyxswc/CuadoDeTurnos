import { useState } from 'react';
import { NOMBRE_CARGO } from '@sgt/shared-types';
import { useEstado } from '../estado';
import { PERSONAS } from '../datos/mock';

export function Login() {
  const { iniciarSesion } = useEstado();
  const [usuarioId, setUsuarioId] = useState('u0');

  return (
    <div className="login">
      <form
        className="tarjeta"
        onSubmit={(e) => {
          e.preventDefault();
          iniciarSesion(usuarioId);
        }}
      >
        <div className="marca">
          Turno<b>Care</b>
        </div>
        <p className="sub">Gestión de turnos de enfermería</p>
        <label>
          Usuario (prototipo: elige con quién entrar)
          <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombres} · {p.rol === 'COORDINADOR' ? 'Coordinador/a' : NOMBRE_CARGO[p.cargo]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contraseña
          <input type="password" defaultValue="demo1234" />
        </label>
        <button className="primario grande" type="submit">
          Ingresar
        </button>
        <div className="alerta-caja info">
          En la versión final: contraseña temporal con cambio obligatorio en el primer ingreso, aviso de privacidad
          (Ley 1581) y cierre de sesión por inactividad a los 15 minutos.
        </div>
      </form>
    </div>
  );
}
