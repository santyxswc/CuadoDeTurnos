# Bitácora · Sprint 0 (23 al 29 de septiembre de 2026)

**Entregable:** requisitos validados internamente, modelo de datos, repositorio con CI y **prototipo navegable** para la reunión con el cliente del **miércoles 30 de septiembre**.

## Lenguajes y tecnologías usadas

| Dónde | Lenguaje | Para qué |
|---|---|---|
| `apps/desktop` | **TypeScript + TSX (React) + CSS** | Pantallas del prototipo; Electron para empaquetarlo como app de escritorio |
| `apps/api` | **TypeScript (NestJS)** | Esqueleto de la API con endpoint de salud |
| `packages/rules-engine` | **TypeScript puro** | Reglas laborales: horas, recargos, estado del turno, aptitud |
| `packages/shared-types` | **TypeScript** | Tipos y parámetros compartidos entre API y app |
| `.github/` | **YAML** | Pipeline de CI |
| Datos | **JSON** | Sin base de datos: archivos JSON administrados por la API (ADR-010) |
| `docs/` | **Markdown** | Documentación |

## Paso a paso

| # | Commit | Qué se hizo | Por qué |
|---|---|---|---|
| 1 | `chore: inicializar monorepo…` | Monorepo con npm workspaces (`apps/*`, `packages/*`), configuración base de TypeScript, `.gitignore`, `.editorconfig`, `.nvmrc`. Documentos movidos a `docs/` y `docs/cliente/`. | Estructura definida en §8.3 del plan técnico. |
| 2 | `docs: incorporar respuestas del cliente…` | Nuevo `02_Decisiones_Respuestas_Cliente.md`. Plan técnico sube a v0.2 (supuestos, ADR-008 y ADR-009, RNF-03). | Las respuestas cambian el alcance: valor en pesos de recargos y datos de pacientes. |
| 3 | `feat(shared-types)…` | Enums (roles, cargos, estados de solicitud, egreso…), DTOs y `PARAMETROS_DEFECTO`. | Un solo lugar para los valores que usan la API y la app. |
| 4 | `feat(rules-engine): calcular horas…` | `calcularMinutos` (RN-01) y `valorizarRecargos` (RN-07). 11 pruebas: los 5 casos obligatorios del plan + tabla del cliente. | Es la parte con más riesgo de error; se prueba primero. |
| 5 | `feat(api)…` | NestJS con `GET /api/salud`; `schema.prisma` y `docker-compose` de PostgreSQL (**eliminados después en el paso 12**, ver ADR-010). | Base para el Sprint 1 (auth y usuarios). |
| 6 | `feat(rules-engine): estado del turno y aptos` | `estadoTurno` (En turno, Retrasado, Ausente…) y `evaluarAptitud` (RN-03). 13 pruebas más (24 en total). | El prototipo las usa, así que lo que ve el cliente ya es el cálculo real. |
| 7 | `feat(desktop)…` | Prototipo navegable con 9 pantallas y datos de ejemplo (1 coordinadora + 9 enfermeros, como el equipo real). | Es lo que se muestra el 30-sep. |
| 8 | `ci…` | GitHub Actions: corre las pruebas y compila todo en cada push y pull request. | Definition of Done del plan técnico. |
| 9 | `docs: agregar README…` | README con instrucciones y esta bitácora. | Control del avance. |
| 10 | `chore: permitir el script de instalacion de electron` | Aprobación de Electron en `allowScripts`. | npm 12 bloquea los scripts de instalación. |
| 11 | `docs: reemplazar PostgreSQL por… JSON (ADR-010)` | **Decisión del equipo: no se usa base de datos.** Plan técnico v0.3: ADR-010, carpeta de datos, reglas de escritura segura, diagramas C4, respaldos y pruebas. | Tiempo, costo y complejidad; app interna de 10 usuarios, no expuesta a internet. |
| 12 | `refactor(api): quitar Prisma y PostgreSQL` | Se eliminan el esquema Prisma, el docker-compose y sus dependencias. Se corrige que `react` no estaba declarado en `apps/desktop/package.json`. | Alinear el código con ADR-010. De paso bajan las alertas de `npm audit` de 6 a 2. |

## Qué mostrar el 30-sep (guion sugerido, 15 min)

1. **Entrar como la coordinadora (Laura Méndez).** Página principal: cuadro de la semana, estado del turno actual (Diana aparece *Retrasada*), chat con novedades.
2. **Editor de cuadro:** hacer clic en celdas para crear un conflicto (ej. poner N y al día siguiente M) → aparece ⚠ con el motivo. Publicar.
3. **Solicitudes:** aprobar el permiso de Andrés.
4. **Filtro de aptos:** turno N del 19-oct (vacaciones de Sofía) → quién puede cubrirlo y por qué no los demás.
5. **Horas y recargos:** elegir una persona → horas diurnas/nocturnas/festivas y valor estimado en pesos. Aprovechar para validar la tabla de recargos y el salario de auxiliar.
6. **Vacaciones:** simular un rango → días hábiles y fecha de reintegro; saldos del equipo.
7. **Pacientes atendidos:** mostrar el formulario con los datos pedidos y el aviso de datos sensibles → **pedir la aprobación escrita**.
8. **Salir y entrar como enfermero (Andrés Rojas):** ve lo mismo pero sin editor ni administración y sin horas de otros.

## Pendiente para cerrar el Sprint 0

- [ ] Respuestas del cliente a las preguntas del §6 del documento de decisiones (público/privado, servidor/TI, horarios de turnos, sábado hábil).
- [ ] Aprobación escrita de ADR-008 (recargos en pesos) y ADR-009 (datos de pacientes).
- [x] Subir el repositorio a GitHub y confirmar que el CI pasa (24-sep, commit `b55de92`).
- [ ] Revisar las 2 alertas moderadas de `npm audit` (vienen de Vitest, solo se usa en pruebas).

## Siguiente: Sprint 1 (30-sep al 6-oct)

Autenticación con los dos roles (Argon2id + tokens), CRUD de usuarios, tipos de turno, parámetros con vigencia y festivos guardados en archivos JSON (capa de repositorios con escritura atómica, ADR-010), y conectar la página principal a la API.
