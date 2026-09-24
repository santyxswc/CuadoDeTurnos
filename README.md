# TurnoCare · SGT (Sistema de Gestión de Turnos de Enfermería)

Aplicación de escritorio para que un equipo de enfermería maneje su cuadro de turnos, marcaciones de entrada y salida, horas diurnas/nocturnas, recargos, solicitudes, vacaciones, pacientes atendidos y chat del equipo.

Entrega comprometida: **11 de noviembre de 2026**.

## Tecnologías

| Parte | Lenguaje | Tecnología |
|---|---|---|
| App de escritorio | TypeScript + CSS | Electron, React 19, Vite |
| API | TypeScript | Node.js, NestJS 11 |
| Base de datos | SQL (vía Prisma) | PostgreSQL 17, Prisma ORM 7 |
| Motor de reglas | TypeScript puro | Sin dependencias; pruebas con Vitest |
| Infraestructura | YAML | Docker Compose, GitHub Actions |

## Estructura

```
apps/
  desktop/        App de escritorio (Electron + React). Hoy: prototipo navegable con datos de ejemplo
  api/            API NestJS + esquema Prisma (prisma/schema.prisma)
packages/
  shared-types/   Enums, DTOs y parámetros laborales por defecto
  rules-engine/   Cálculo de horas, recargos, estado del turno y filtro de aptos
infra/            docker-compose de PostgreSQL para desarrollo
docs/             Plan técnico, decisiones, bitácora y documentos del cliente
```

## Cómo ejecutar

Requisitos: Node.js 22 o superior. Docker solo si vas a levantar la base de datos.

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

# Base de datos local
npm run db:up
cp apps/api/.env.example apps/api/.env
```

> **Electron:** si tu versión de npm bloquea los scripts de instalación, el binario de Electron no se descarga. Apruébalo con `npm install-scripts approve electron` y vuelve a ejecutar `npm install`.

## Documentación

- [Plan técnico](docs/01_Plan_Tecnico_Equipo_Desarrollo_SGT.md)
- [Decisiones a partir de las respuestas del cliente](docs/02_Decisiones_Respuestas_Cliente.md)
- [Bitácora del Sprint 0](docs/03_Bitacora_Sprint0.md)
