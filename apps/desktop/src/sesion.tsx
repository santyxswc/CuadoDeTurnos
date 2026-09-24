// Sesión real contra la API (Sprint 1): login, cambio de contraseña obligatorio e inactividad (RF-AUT-04/05).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PARAMETROS_DEFECTO, type ParametroDto, type RespuestaLoginDto, type UsuarioDto } from '@sgt/shared-types';
import { alExpirarSesion, api, configurarSesion, edadTokenMs, refrescar } from './api/cliente';

interface Sesion {
  usuario: UsuarioDto | null;
  /** Mensaje para mostrar en el login (ej. sesión cerrada por inactividad). */
  aviso: string | null;
  iniciar: (usuario: string, password: string) => Promise<void>;
  cerrar: (aviso?: string) => Promise<void>;
  cambiarPassword: (actual: string, nueva: string) => Promise<void>;
}

const Contexto = createContext<Sesion | null>(null);

/** Se renueva el token cuando tiene más de 8 minutos (vive 10) y hubo actividad. */
const RENOVAR_DESPUES_MS = 8 * 60_000;

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioDto | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const ultimaActividad = useRef(Date.now());
  const inactividadMs = useRef(PARAMETROS_DEFECTO['seguridad.inactividad_min'] * 60_000);

  const cerrar = useCallback(async (motivo?: string) => {
    try {
      await api('POST', '/auth/logout');
    } catch {
      // Si la sesión ya no existe en el servidor, igual se cierra localmente.
    }
    configurarSesion(null);
    setUsuario(null);
    setAviso(motivo ?? null);
  }, []);

  useEffect(() => {
    alExpirarSesion((motivo) => {
      setUsuario(null);
      setAviso(motivo);
    });
  }, []);

  // Actividad del usuario y cierre por inactividad (equipos compartidos en la estación de enfermería).
  useEffect(() => {
    if (!usuario) return;
    const marcar = () => (ultimaActividad.current = Date.now());
    const eventos = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    const reloj = window.setInterval(() => {
      const inactivo = Date.now() - ultimaActividad.current;
      if (inactivo >= inactividadMs.current) {
        void cerrar(`Se cerró la sesión por ${Math.round(inactividadMs.current / 60_000)} minutos de inactividad.`);
      } else if (edadTokenMs() > RENOVAR_DESPUES_MS) {
        refrescar().catch(() => undefined);
      }
    }, 15_000);
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcar));
      window.clearInterval(reloj);
    };
  }, [usuario, cerrar]);

  const iniciar = async (usuarioTexto: string, password: string) => {
    const r = await api<RespuestaLoginDto>('POST', '/auth/login', { usuario: usuarioTexto, password, equipo: navigator.platform || null });
    configurarSesion(r);
    ultimaActividad.current = Date.now();
    setAviso(null);
    setUsuario(r.usuario);
    if (!r.usuario.debeCambiarPassword) cargarInactividad();
  };

  const cargarInactividad = () => {
    api<ParametroDto[]>('GET', '/parametros')
      .then((ps) => {
        const p = ps.find((x) => x.clave === 'seguridad.inactividad_min');
        if (typeof p?.valor === 'number') inactividadMs.current = p.valor * 60_000;
      })
      .catch(() => undefined);
  };

  const cambiarPassword = async (actual: string, nueva: string) => {
    const u = await api<UsuarioDto>('POST', '/auth/cambiar-password', { actual, nueva });
    setUsuario(u);
    cargarInactividad();
  };

  return <Contexto.Provider value={{ usuario, aviso, iniciar, cerrar, cambiarPassword }}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  return c;
}
