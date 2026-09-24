import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const paquete = (ruta: string) => fileURLToPath(new URL(`../../packages/${ruta}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Rutas relativas para que el build cargue desde file:// dentro de Electron.
  base: './',
  resolve: {
    // Se usa el código fuente TS de los paquetes compartidos directamente.
    alias: {
      '@sgt/shared-types': paquete('shared-types/src/index.ts'),
      '@sgt/rules-engine': paquete('rules-engine/src/index.ts'),
    },
  },
  server: { port: 5173, strictPort: true },
});
