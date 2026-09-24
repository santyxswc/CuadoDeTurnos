import { useState } from 'react';
import { useSesion } from '../sesion';

/** RF-AUT-04: en el primer ingreso (o tras un restablecimiento) la contraseña temporal se cambia antes de seguir. */
export function CambiarPassword() {
  const { usuario, cambiarPassword, cerrar } = useSesion();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const politica = nueva.length >= 8 && /[A-Za-z]/.test(nueva) && /\d/.test(nueva);
  const coinciden = nueva === confirmacion;

  return (
    <div className="login">
      <form
        className="tarjeta"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setCargando(true);
          try {
            await cambiarPassword(actual, nueva);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setCargando(false);
          }
        }}
      >
        <h2>Hola, {usuario?.nombres}</h2>
        <p className="sub">Por seguridad, cambia la contraseña temporal que te entregaron antes de continuar.</p>
        <label>
          Contraseña temporal
          <input type="password" autoFocus autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
        </label>
        <label>
          Nueva contraseña
          <input type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
        </label>
        <label>
          Repite la nueva contraseña
          <input type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
        </label>
        <ul className="motivos">
          <li style={{ color: politica ? 'var(--verde)' : undefined }}>Al menos 8 caracteres, con letras y números</li>
          <li style={{ color: nueva && coinciden ? 'var(--verde)' : undefined }}>Las dos contraseñas coinciden</li>
        </ul>
        {error && <div className="alerta-caja error">{error}</div>}
        <button className="primario grande" type="submit" disabled={cargando || !actual || !politica || !coinciden}>
          Guardar y continuar
        </button>
        <button type="button" className="enlace" onClick={() => void cerrar()}>
          Salir
        </button>
      </form>
    </div>
  );
}
