import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Rol } from '@sgt/shared-types';
import type { UsuarioGuardado } from '../almacen/modelos';

export const CLAVE_PUBLICO = 'publico';
export const CLAVE_ROLES = 'roles';
export const CLAVE_SIN_CAMBIO_PASSWORD = 'permitirConCambioPendiente';

/** La ruta no requiere sesión (login, refresco). */
export const Publico = () => SetMetadata(CLAVE_PUBLICO, true);

/** Solo estos roles pueden usar la ruta. Se valida en el servidor (RF-AUT-02). */
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);

/** La ruta se puede usar aunque la persona aún deba cambiar su contraseña temporal. */
export const PermitirConCambioPendiente = () => SetMetadata(CLAVE_SIN_CAMBIO_PASSWORD, true);

export interface PeticionAutenticada {
  usuario: UsuarioGuardado;
  sesionId: string;
}

export const UsuarioActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<PeticionAutenticada>().usuario,
);

export const SesionActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<PeticionAutenticada>().sesionId,
);
