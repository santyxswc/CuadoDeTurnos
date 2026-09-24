# Bitácora · Sprint 1 (30 de septiembre al 6 de octubre de 2026)

**Objetivo (plan técnico §12):** autenticación, roles, usuarios, tipos de turno, configuración y festivos.
**Entregable demostrable:** login funcional con los dos roles y administración básica. Se muestra en la reunión del **miércoles 14 de octubre** (reuniones quincenales).

## Lenguajes y tecnologías de este sprint

| Dónde | Lenguaje | Qué se agregó |
|---|---|---|
| `apps/api` | TypeScript (NestJS) | Autenticación, usuarios, tipos de turno, parámetros, festivos y auditoría |
| `apps/api/src/almacen` | TypeScript | Persistencia en archivos **JSON** (ADR-010): escritura atómica, cola y caché |
| `apps/desktop` | TypeScript + React | Login real, cambio de contraseña, cierre por inactividad y Administración conectada a la API |
| `packages/rules-engine` | TypeScript puro | Cálculo de festivos de Colombia |
| Pruebas | `node:test` (API) y Vitest (motor) | 60 pruebas en total |

Librerías nuevas: `@nestjs/jwt` (tokens), `class-validator` y `class-transformer` (validación de datos), `@node-rs/argon2` (contraseñas; trae binarios precompilados, así que no necesita scripts de instalación).

## Paso a paso

| # | Commit | Qué se hizo | Por qué |
|---|---|---|---|
| 1 | `feat(rules-engine): calcular festivos…` | Festivos de Colombia calculados con la Pascua y la Ley Emiliani. Si dos caen el mismo lunes (30-jun-2025, 1-jul-2030) se unen los nombres. | RF-ADM-02 pide festivos precargados para cualquier año sin escribirlos a mano. |
| 2 | `feat(api): almacen de archivos JSON…` | `ArchivoJson`, `ColeccionJson` y `RegistroJsonl`: escritura atómica (`.tmp` + rename), una escritura a la vez, datos en memoria, copias defensivas. | Base de ADR-010. Probado con 100 escrituras simultáneas sin pérdidas. |
| 3 | `feat(shared-types): agregar DTOs…` | Tipos de respuesta de la API compartidos con la app. | Un solo contrato entre API y app. |
| 4 | `feat(api): autenticacion, usuarios…` | Todo el backend del sprint (ver endpoints abajo) + 20 pruebas de punta a punta por HTTP. | RF-AUT-01 a 05, RF-CUA-01, RF-ADM-01 a 03. |
| 5 | `ci: compilar antes de probar` | El CI compila primero porque las pruebas de la API usan los paquetes compilados. | Evitar fallos falsos en GitHub. |
| 6 | `feat(api): script para crear los usuarios de ejemplo` | `npm run semilla:demo -w @sgt/api` crea las 10 personas del prototipo (contraseña `Demo2026`). | Probar el login con los mismos datos que muestran las pantallas de ejemplo. |
| 7 | `feat(desktop): inicio de sesion real…` | Login, cambio de contraseña obligatorio, inactividad y Administración con 5 pestañas contra la API. | Entregable del sprint. |

## Seguridad implementada

- **Contraseñas** con Argon2id (parámetros OWASP). Nunca se devuelven ni se escriben en la auditoría.
- **Token de acceso** de 10 minutos y **token de refresco** que cambia en cada uso; si alguien reutiliza uno viejo, se rechaza.
- **Inactividad (RF-AUT-05):** la app cierra la sesión tras 15 min sin actividad (parámetro `seguridad.inactividad_min`), y el servidor también rechaza refrescar una sesión inactiva por más de ese tiempo.
- **Bloqueo:** 5 intentos fallidos bloquean ese usuario 5 minutos. El mensaje de error es el mismo si el usuario no existe o la contraseña falla.
- **Roles en el servidor (RF-AUT-02):** cada ruta valida el rol; la app solo oculta botones.
- **Contraseña temporal (RF-AUT-04):** mientras no se cambie, la API solo permite `/auth/cambiar-password`, `/auth/yo` y `/auth/logout`.
- Al desactivar un usuario o restablecer su contraseña se cierran todas sus sesiones.
- Siempre queda al menos un coordinador activo; nadie puede desactivarse a sí mismo.

## Endpoints disponibles (`http://localhost:3000/api`)

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `GET /salud` | Público | Estado y hora del servidor |
| `POST /auth/login` | Público | Entrar con documento o correo |
| `POST /auth/refrescar` | Público | Renovar tokens |
| `POST /auth/logout` · `GET /auth/yo` · `POST /auth/cambiar-password` | Con sesión | Sesión propia |
| `GET /usuarios` | Todos | Coordinador: datos completos · Enfermero: nombre, rol y cargo de compañeros activos |
| `GET /usuarios/:id` | Coordinador o la misma persona | Detalle |
| `POST /usuarios` · `PATCH /usuarios/:id` | Coordinador | Crear (devuelve contraseña temporal) y editar |
| `POST /usuarios/:id/salarios` | Coordinador | Nuevo salario con vigencia |
| `POST /usuarios/:id/desactivar` · `/activar` · `/restablecer-password` | Coordinador | Estado y contraseña |
| `GET /tipos-turno` | Todos | Catálogo (`?incluirInactivos=true`) |
| `POST /tipos-turno` · `PATCH /tipos-turno/:id` · `POST …/desactivar` · `…/activar` | Coordinador | Administrar |
| `GET /parametros?fecha=YYYY-MM-DD` | Todos | Valores vigentes en esa fecha |
| `GET /parametros/historial` · `POST /parametros` | Coordinador | Historial y nueva vigencia |
| `GET /festivos?anio=2026` | Todos | Festivos del año |
| `POST /festivos` · `DELETE /festivos/:fecha` · `POST /festivos/precargar` | Coordinador | Administrar |
| `GET /auditoria?limite=100` | Coordinador | Últimas acciones |

## Archivos que crea la API en la carpeta de datos

`usuarios.json`, `sesiones.json`, `tipos-turno.json`, `parametros.json`, `festivos.json` y `auditoria.jsonl`.
La primera vez que arranca sin usuarios crea el coordinador inicial (`admin`) y muestra su contraseña temporal en la consola. También precarga los 4 tipos de turno, los parámetros con los cambios de ley ya conocidos (nocturna desde las 19:00 el 25-dic-2025, 42 h desde el 15-jul-2026, dominical 90 % → 100 % el 1-jul-2027) y los festivos del año actual y el siguiente.

## Cómo probarlo

```bash
npm install && npm run build
cp apps/api/.env.example apps/api/.env         # poner un SGT_JWT_SECRET
npm run semilla:demo -w @sgt/api               # opcional: 10 usuarios de ejemplo (contraseña Demo2026)
npm run start -w @sgt/api                      # la consola muestra la contraseña temporal de "admin"
npm run dev:desktop                            # en otra terminal → http://localhost:5173
```

## Qué sigue con datos de ejemplo

Página principal, editor de cuadro, solicitudes, aptos, horas, vacaciones y pacientes siguen con los datos en memoria del prototipo (lo indica el aviso amarillo). Al entrar con un usuario real, esas pantallas se muestran con la persona de ejemplo del mismo documento; si no hay, con Laura Méndez (coordinador) o Andrés Rojas (enfermero).

## Pendiente / decisiones para el cliente

- [x] Cierre de sesión por inactividad: **15 minutos confirmado** (24-sep-2026).
- [ ] Recuperación de contraseña: hoy la restablece el coordinador (la recuperación por correo es "Could").
- [ ] La auditoría crece sin límite; rotarla por año cuando se acerque la entrega.

## Siguiente: Sprint 2 (7 al 13 de octubre)

Editor de cuadro real (borrador, advertencias, publicar, versiones) guardado en `cuadros.json`, vista general en la página principal y actualizaciones en tiempo real con Socket.IO.
