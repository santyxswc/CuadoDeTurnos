import type { UsuarioDto, UsuarioResumenDto } from '@sgt/shared-types';
import type { UsuarioGuardado } from '../almacen/modelos';

export const aUsuarioDto = (u: UsuarioGuardado): UsuarioDto => ({
  id: u.id,
  documento: u.documento,
  nombres: u.nombres,
  email: u.email,
  rol: u.rol,
  cargo: u.cargo,
  fechaIngreso: u.fechaIngreso,
  activo: u.activo,
  debeCambiarPassword: u.debeCambiarPassword,
  salarios: u.salarios,
});

export const aResumenDto = ({ id, nombres, rol, cargo, activo }: UsuarioGuardado): UsuarioResumenDto => ({ id, nombres, rol, cargo, activo });
