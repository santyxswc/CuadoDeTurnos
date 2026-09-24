import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ProveedorEstado } from './estado';
import { ProveedorSesion } from './sesion';
import './estilos.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorSesion>
      <ProveedorEstado>
        <App />
      </ProveedorEstado>
    </ProveedorSesion>
  </StrictMode>,
);
