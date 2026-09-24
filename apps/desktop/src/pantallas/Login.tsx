import { useState } from 'react';
import { useSesion } from '../sesion';

export function Login() {
  const { iniciar, aviso } = useSesion();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  return (
    <div className="login">
      <form
        className="tarjeta"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setCargando(true);
          try {
            await iniciar(usuario.trim(), password);
          } catch (err) {
            setError((err as Error).message);
            setPassword('');
          } finally {
            setCargando(false);
          }
        }}
      >
        <div className="marca">
          Turno<b>Care</b>
        </div>
        <p className="sub">Gestión de turnos de enfermería</p>
        {aviso && <div className="alerta-caja aviso">{aviso}</div>}
        <label>
          Documento o correo
          <input autoFocus autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="alerta-caja error">{error}</div>}
        <button className="primario grande" type="submit" disabled={cargando || !usuario || !password}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <small style={{ color: 'var(--suave)' }}>¿Olvidaste tu contraseña? Pídele al coordinador que la restablezca.</small>
      </form>
    </div>
  );
}
