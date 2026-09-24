# CLAUDE.md

Contexto del proyecto para Claude Code. Léelo antes de proponer cambios.

## Proyecto
TurnoCare / SGT: app de escritorio para gestionar turnos de enfermería de **un solo servicio con 10 usuarios** (1 coordinador + 9 enfermeros). App interna, **no se publica en internet**. Entrega final: **11-nov-2026**.

## Decisiones que no se deben revertir sin preguntar
- **NO hay base de datos** (ni PostgreSQL, ni SQLite, ni Prisma, ni Docker). Toda la información, credenciales incluidas, se guarda en **archivos JSON** que **solo la API** lee y escribe. Ver ADR-010 y §8.3 de `docs/01_Plan_Tecnico_Equipo_Desarrollo_SGT.md` (estructura de la carpeta de datos y reglas: escritura atómica con `.tmp` + rename, cola de escrituras, caché en memoria, repositorios con interfaz).
- Las apps de escritorio **nunca** acceden a los archivos directamente; todo pasa por la API.
- Contraseñas siempre hasheadas (Argon2id). Documento, teléfono y diagnóstico de pacientes cifrados (AES-256-GCM) dentro de `pacientes.json`; la llave va en una variable de entorno, no en la carpeta de datos.
- Las marcaciones usan la hora del servidor. Zona horaria `America/Bogota`.
- Las horas oficiales para nómina son las **marcadas** (reales), no las programadas.

## Stack
TypeScript en todo el monorepo (npm workspaces):
- `apps/desktop`: Electron + React 19 + Vite. Login y Administración ya usan la API (`src/api/cliente.ts`, `src/sesion.tsx`); el resto de pantallas sigue con datos de ejemplo en memoria (`src/datos/mock.ts`) hasta su sprint.
- `apps/api`: NestJS 11. Persistencia en `src/almacen/archivo-json.ts` (`ColeccionJson`, `RegistroJsonl`) a través de `AlmacenService`. Todas las rutas requieren sesión salvo `@Publico()`; roles con `@Roles('COORDINADOR')`. Toda acción sensible se registra con `AuditoriaService`.
- `packages/rules-engine`: reglas laborales puras (horas diurnas/nocturnas/dominicales, recargos, estado del turno, aptitud). Pruebas con Vitest; cualquier cambio de reglas va con pruebas.
- `packages/shared-types`: enums, DTOs y `PARAMETROS_DEFECTO`.

## Comandos
- `npm run dev:desktop`: prototipo en http://localhost:5173
- `npm run build` antes de `npm test` (las pruebas de la API usan los paquetes compilados)
- `npm test`: Vitest en `rules-engine` y `node:test` en la API (incluye pruebas de punta a punta por HTTP con carpeta de datos temporal)
- `npm run start -w @sgt/api` / `npm run semilla:demo -w @sgt/api` (usuarios de ejemplo, contraseña `Demo2026`)
- `npm run build` / `npm run typecheck`
- Si Electron no abre: `node node_modules/electron/install.js` (npm 12 bloquea el script de instalación).

## Documentación
- `docs/01_Plan_Tecnico_Equipo_Desarrollo_SGT.md`: requisitos, reglas de negocio, ADRs, C4 y plan de sprints.
- `docs/02_Decisiones_Respuestas_Cliente.md`: respuestas del cliente y los cambios de alcance que generaron (recargos en pesos, datos de pacientes).
- `docs/03_Bitacora_Sprint0.md`, `docs/04_Bitacora_Sprint1.md`: bitácoras de avance (una por sprint). **Actualízalas al terminar cada paso.**

## Forma de trabajo
- Todo en español: código de dominio, textos de la interfaz, documentos y mensajes de commit (formato convencional: `feat(modulo): ...`).
- Commits sin trailer `Co-Authored-By`.
