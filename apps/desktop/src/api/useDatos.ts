import { useCallback, useEffect, useState } from 'react';
import { api } from './cliente';

/** Carga un recurso GET de la API y permite recargarlo después de un cambio. */
export function useDatos<T>(ruta: string | null) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const recargar = useCallback(async () => {
    if (!ruta) return;
    setCargando(true);
    try {
      setDatos(await api<T>('GET', ruta));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [ruta]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { datos, error, cargando, recargar };
}

/** Ejecuta una acción contra la API guardando el error para mostrarlo. */
export function useAccion() {
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const ejecutar = async <T,>(accion: () => Promise<T>): Promise<T | undefined> => {
    setOcupado(true);
    setError(null);
    try {
      return await accion();
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      setOcupado(false);
    }
  };

  return { error, ocupado, ejecutar, limpiar: () => setError(null) };
}
