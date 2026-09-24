# TurnoCare · SGT (Sistema de Gestión de Turnos de Enfermería)

Aplicación de escritorio para que un equipo de enfermería maneje su cuadro de turnos, marcaciones de entrada y salida, horas diurnas/nocturnas, recargos, solicitudes, vacaciones, pacientes atendidos y chat del equipo.

Entrega comprometida: **11 de noviembre de 2026**.

## Tecnologías

| Parte | Lenguaje | Tecnología |
|---|---|---|
| App de escritorio | TypeScript + CSS | Electron, React 19, Vite |
| API | TypeScript | Node.js, NestJS 11 |
| Datos | JSON | **Sin base de datos**: archivos JSON que solo la API lee y escribe (ADR-010) |
| Motor de reglas | TypeScript puro | Sin dependencias; pruebas con Vitest |
| Infraestructura | YAML | GitHub Actions |

## Estructura

```
apps/
  desktop/        App de escritorio (Electron + React). Hoy: prototipo navegable con datos de ejemplo
  api/            API NestJS; guarda los datos en archivos JSON (carpeta apps/api/datos/, ignorada por git)
packages/
  shared-types/   Enums, DTOs y parámetros laborales por defecto
  rules-engine/   Cálculo de horas, recargos, estado del turno y filtro de aptos
docs/             Plan técnico, decisiones, bitácora y documentos del cliente
```

## Cómo ejecutar

Requisitos: Node.js 22 o superior. No se necesita base de datos ni Docker.

```bash
npm install

# Prototipo en el navegador (http://localhost:5173)
npm run dev:desktop

# Prototipo como app de escritorio (ver nota sobre Electron abajo)
npm run build -w @sgt/desktop
npm run electron -w @sgt/desktop

# Pruebas del motor de reglas
npm test

# API (http://localhost:3000/api/salud)
npm run build && npm run start -w @sgt/api

# Configuración de la API (puerto y carpeta de datos JSON)
cp apps/api/.env.example apps/api/.env
```

> **Electron:** npm 12 bloquea los scripts de instalación y el binario de Electron puede no descargarse (pasa incluso con la aprobación ya guardada en `package.json`). Si `npm run electron` falla, ejecuta una vez:
> ```bash
> node node_modules/electron/install.js
> ```

## Documentación

- [Plan técnico](docs/01_Plan_Tecnico_Equipo_Desarrollo_SGT.md)
- [Decisiones a partir de las respuestas del cliente](docs/02_Decisiones_Respuestas_Cliente.md)
- [Bitácora del Sprint 0](docs/03_Bitacora_Sprint0.md)
